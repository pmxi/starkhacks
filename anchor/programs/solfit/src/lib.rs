use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;
use anchor_lang::system_program;

declare_id!("Bhxa6QHF3mJL36ak12mr9kzHLnZXjBv1q8MQHkz54VHe");

const REFUND_GRACE_SECS: i64 = 3600;
const ED25519_PROGRAM_ID: Pubkey = pubkey!("Ed25519SigVerify111111111111111111111111111");

#[program]
pub mod solfit {
    use super::*;

    pub fn create_contest(
        ctx: Context<CreateContest>,
        contest_id: u64,
        wager: u64,
        max_players: u8,
        duration: u32,
        judge: Pubkey,
    ) -> Result<()> {
        require!(
            max_players >= 2 && max_players <= 8,
            SolfitError::InvalidMaxPlayers
        );
        require!(duration > 0, SolfitError::InvalidDuration);

        let c = &mut ctx.accounts.contest;
        c.creator = ctx.accounts.creator.key();
        c.contest_id = contest_id;
        c.wager = wager;
        c.max_players = max_players;
        c.duration = duration;
        c.judge = judge;
        c.start_time = 0;
        c.deadline = 0;
        c.status = ContestStatus::Open as u8;
        c.winner = Pubkey::default();
        c.players = Vec::new();
        c.final_scores = Vec::new();
        c.withdrawn = Vec::new();
        Ok(())
    }

    pub fn join_contest(ctx: Context<JoinContest>) -> Result<()> {
        let c = &mut ctx.accounts.contest;
        require!(c.status == ContestStatus::Open as u8, SolfitError::NotOpen);
        require!((c.players.len() as u8) < c.max_players, SolfitError::Full);
        let player_key = ctx.accounts.player.key();
        require!(!c.players.contains(&player_key), SolfitError::AlreadyJoined);

        let wager = c.wager;
        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: c.to_account_info(),
            },
        );
        system_program::transfer(cpi, wager)?;

        c.players.push(player_key);
        c.withdrawn.push(false);

        if (c.players.len() as u8) == c.max_players {
            let now = Clock::get()?.unix_timestamp;
            c.start_time = now;
            c.deadline = now + c.duration as i64;
            c.status = ContestStatus::Active as u8;
        }
        Ok(())
    }

    pub fn settle(ctx: Context<Settle>, scores: Vec<u32>) -> Result<()> {
        {
            let c = &ctx.accounts.contest;
            require!(
                c.status == ContestStatus::Active as u8,
                SolfitError::NotActive
            );
            require!(
                Clock::get()?.unix_timestamp >= c.deadline,
                SolfitError::DeadlineNotPassed
            );
            require!(
                scores.len() == c.players.len(),
                SolfitError::ScoreLengthMismatch
            );
        }

        let contest_pda = ctx.accounts.contest.key();
        let judge = ctx.accounts.contest.judge;

        let mut expected_message = Vec::with_capacity(32 + 4 + scores.len() * 4);
        expected_message.extend_from_slice(contest_pda.as_ref());
        expected_message.extend_from_slice(&(scores.len() as u32).to_le_bytes());
        for s in &scores {
            expected_message.extend_from_slice(&s.to_le_bytes());
        }

        verify_ed25519_judge(&ctx.accounts.instructions, &judge, &expected_message)?;

        let mut winner_idx = 0usize;
        let mut max_score = scores[0];
        for i in 1..scores.len() {
            if scores[i] > max_score {
                max_score = scores[i];
                winner_idx = i;
            }
        }

        let c = &mut ctx.accounts.contest;
        c.winner = c.players[winner_idx];
        c.final_scores = scores;
        c.status = ContestStatus::Settled as u8;
        Ok(())
    }

    pub fn claim_pot(_ctx: Context<ClaimPot>) -> Result<()> {
        Ok(())
    }

    pub fn refund_timeout(ctx: Context<RefundTimeout>) -> Result<()> {
        let c = &mut ctx.accounts.contest;
        require!(
            c.status == ContestStatus::Active as u8,
            SolfitError::NotActive
        );
        require!(
            Clock::get()?.unix_timestamp >= c.deadline + REFUND_GRACE_SECS,
            SolfitError::RefundWindowNotReached
        );
        c.status = ContestStatus::Refunding as u8;
        Ok(())
    }

    pub fn withdraw_refund(ctx: Context<WithdrawRefund>) -> Result<()> {
        let all_done = {
            let c = &mut ctx.accounts.contest;
            require!(
                c.status == ContestStatus::Refunding as u8,
                SolfitError::NotRefunding
            );
            let signer_key = ctx.accounts.player.key();
            let idx = c
                .players
                .iter()
                .position(|p| *p == signer_key)
                .ok_or(SolfitError::NotAPlayerOfContest)?;
            require!(!c.withdrawn[idx], SolfitError::AlreadyRefunded);
            c.withdrawn[idx] = true;
            c.withdrawn.iter().all(|w| *w)
        };

        let wager = ctx.accounts.contest.wager;
        let contest_info = ctx.accounts.contest.to_account_info();
        let player_info = ctx.accounts.player.to_account_info();

        **contest_info.try_borrow_mut_lamports()? -= wager;
        **player_info.try_borrow_mut_lamports()? += wager;

        if all_done {
            let remaining = contest_info.lamports();
            **player_info.try_borrow_mut_lamports()? += remaining;
            **contest_info.try_borrow_mut_lamports()? = 0;
            contest_info.assign(&system_program::ID);
            contest_info.resize(0)?;
        }
        Ok(())
    }
}

fn verify_ed25519_judge(
    ix_sysvar: &AccountInfo,
    expected_pubkey: &Pubkey,
    expected_message: &[u8],
) -> Result<()> {
    let ix = load_instruction_at_checked(0, ix_sysvar)
        .map_err(|_| error!(SolfitError::BadJudgeSignature))?;
    require_keys_eq!(
        ix.program_id,
        ED25519_PROGRAM_ID,
        SolfitError::BadJudgeSignature
    );

    let data = &ix.data;
    require!(data.len() >= 16, SolfitError::BadJudgeSignature);
    require!(data[0] == 1, SolfitError::BadJudgeSignature);

    let pubkey_offset = u16::from_le_bytes([data[6], data[7]]) as usize;
    let msg_offset = u16::from_le_bytes([data[10], data[11]]) as usize;
    let msg_size = u16::from_le_bytes([data[12], data[13]]) as usize;

    require!(
        data.len() >= pubkey_offset + 32 && data.len() >= msg_offset + msg_size,
        SolfitError::BadJudgeSignature
    );

    let signed_pubkey = &data[pubkey_offset..pubkey_offset + 32];
    require!(
        signed_pubkey == expected_pubkey.as_ref(),
        SolfitError::BadJudgeSignature
    );

    let signed_message = &data[msg_offset..msg_offset + msg_size];
    require!(
        signed_message == expected_message,
        SolfitError::MessageMismatch
    );
    Ok(())
}

#[derive(Accounts)]
#[instruction(contest_id: u64, wager: u64, max_players: u8)]
pub struct CreateContest<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 8 + 8 + 1 + 4 + 32 + 8 + 8 + 1 + 32
            + (4 + 32 * max_players as usize)
            + (4 + 4 * max_players as usize)
            + (4 + max_players as usize),
        seeds = [b"contest", creator.key().as_ref(), &contest_id.to_le_bytes()],
        bump,
    )]
    pub contest: Account<'info, Contest>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinContest<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,
    /// CHECK: Instructions sysvar — introspected to verify the preceding Ed25519 precompile ix.
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimPot<'info> {
    #[account(
        mut,
        constraint = contest.status == ContestStatus::Settled as u8 @ SolfitError::NotSettled,
        constraint = contest.winner == winner.key() @ SolfitError::NotWinner,
        close = winner,
    )]
    pub contest: Account<'info, Contest>,
    #[account(mut)]
    pub winner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RefundTimeout<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,
}

#[derive(Accounts)]
pub struct WithdrawRefund<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,
    #[account(mut)]
    pub player: Signer<'info>,
}

#[account]
pub struct Contest {
    pub creator: Pubkey,
    pub contest_id: u64,
    pub wager: u64,
    pub max_players: u8,
    pub duration: u32,
    pub judge: Pubkey,
    pub start_time: i64,
    pub deadline: i64,
    pub status: u8,
    pub winner: Pubkey,
    pub players: Vec<Pubkey>,
    pub final_scores: Vec<u32>,
    pub withdrawn: Vec<bool>,
}

#[repr(u8)]
pub enum ContestStatus {
    Open = 0,
    Active = 1,
    Settled = 2,
    Refunding = 3,
}

#[error_code]
pub enum SolfitError {
    #[msg("max_players must be between 2 and 8")]
    InvalidMaxPlayers,
    #[msg("duration must be positive")]
    InvalidDuration,
    #[msg("contest is not in Open state")]
    NotOpen,
    #[msg("contest is full")]
    Full,
    #[msg("already joined")]
    AlreadyJoined,
    #[msg("contest is not Active")]
    NotActive,
    #[msg("deadline has not passed yet")]
    DeadlineNotPassed,
    #[msg("contest is not Settled")]
    NotSettled,
    #[msg("signer is not the winner")]
    NotWinner,
    #[msg("judge signature is missing, malformed, or from the wrong pubkey")]
    BadJudgeSignature,
    #[msg("signed message does not match the expected (contest, scores) tuple")]
    MessageMismatch,
    #[msg("scores length must equal players length")]
    ScoreLengthMismatch,
    #[msg("refund grace window has not passed yet")]
    RefundWindowNotReached,
    #[msg("contest is not Refunding")]
    NotRefunding,
    #[msg("signer is not a player of this contest")]
    NotAPlayerOfContest,
    #[msg("this player has already refunded")]
    AlreadyRefunded,
}
