use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Bhxa6QHF3mJL36ak12mr9kzHLnZXjBv1q8MQHkz54VHe");

#[program]
pub mod solfit {
    use super::*;

    pub fn create_match(
        ctx: Context<CreateMatch>,
        match_id: u64,
        target: u32,
        wager: u64,
        max_players: u8,
    ) -> Result<()> {
        require!(
            max_players >= 2 && max_players <= 8,
            SolfitError::InvalidMaxPlayers
        );
        require!(target > 0, SolfitError::InvalidTarget);

        let m = &mut ctx.accounts.match_account;
        m.creator = ctx.accounts.creator.key();
        m.match_id = match_id;
        m.target = target;
        m.wager = wager;
        m.max_players = max_players;
        m.status = MatchStatus::Waiting as u8;
        m.winner = Pubkey::default();
        m.players = Vec::new();
        m.session_keys = Vec::new();
        m.counts = Vec::new();
        Ok(())
    }

    pub fn join_match(ctx: Context<JoinMatch>, session_key: Pubkey) -> Result<()> {
        let m = &mut ctx.accounts.match_account;
        require!(
            m.status == MatchStatus::Waiting as u8,
            SolfitError::NotWaiting
        );
        require!((m.players.len() as u8) < m.max_players, SolfitError::Full);
        let player_key = ctx.accounts.player.key();
        require!(
            !m.players.contains(&player_key),
            SolfitError::AlreadyJoined
        );

        let wager = m.wager;
        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: m.to_account_info(),
            },
        );
        system_program::transfer(cpi, wager)?;

        m.players.push(player_key);
        m.session_keys.push(session_key);
        m.counts.push(0);
        Ok(())
    }

    pub fn start_match(ctx: Context<StartMatch>) -> Result<()> {
        let m = &mut ctx.accounts.match_account;
        require!(
            m.status == MatchStatus::Waiting as u8,
            SolfitError::NotWaiting
        );
        require!(
            m.players.len() as u8 == m.max_players,
            SolfitError::NotFull
        );
        require!(
            m.players.contains(&ctx.accounts.caller.key()),
            SolfitError::NotAPlayer
        );
        m.status = MatchStatus::Active as u8;
        Ok(())
    }

    pub fn increment_pushup(ctx: Context<IncrementPushup>) -> Result<()> {
        let m = &mut ctx.accounts.match_account;
        require!(
            m.status == MatchStatus::Active as u8,
            SolfitError::NotActive
        );
        let signer_key = ctx.accounts.signer.key();

        let idx = m
            .players
            .iter()
            .position(|p| *p == signer_key)
            .or_else(|| m.session_keys.iter().position(|s| *s == signer_key))
            .ok_or(SolfitError::NotAuthorized)?;

        m.counts[idx] = m.counts[idx].saturating_add(1);
        if m.counts[idx] >= m.target {
            m.winner = m.players[idx];
            m.status = MatchStatus::Finished as u8;
        }
        Ok(())
    }

    pub fn claim_pot(_ctx: Context<ClaimPot>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(match_id: u64, target: u32, wager: u64, max_players: u8)]
pub struct CreateMatch<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 8 + 4 + 8 + 1 + 1 + 32
            + 4 + 32 * max_players as usize
            + 4 + 32 * max_players as usize
            + 4 + 4 * max_players as usize,
        seeds = [b"match", creator.key().as_ref(), &match_id.to_le_bytes()],
        bump,
    )]
    pub match_account: Account<'info, Match>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct IncrementPushup<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPot<'info> {
    #[account(
        mut,
        constraint = match_account.status == MatchStatus::Finished as u8 @ SolfitError::NotFinished,
        constraint = match_account.winner == winner.key() @ SolfitError::NotWinner,
        close = winner,
    )]
    pub match_account: Account<'info, Match>,
    #[account(mut)]
    pub winner: Signer<'info>,
}

#[account]
pub struct Match {
    pub creator: Pubkey,
    pub match_id: u64,
    pub target: u32,
    pub wager: u64,
    pub max_players: u8,
    pub status: u8,
    pub winner: Pubkey,
    pub players: Vec<Pubkey>,
    pub session_keys: Vec<Pubkey>,
    pub counts: Vec<u32>,
}

#[repr(u8)]
pub enum MatchStatus {
    Waiting = 0,
    Active = 1,
    Finished = 2,
}

#[error_code]
pub enum SolfitError {
    #[msg("max_players must be between 2 and 8")]
    InvalidMaxPlayers,
    #[msg("target must be positive")]
    InvalidTarget,
    #[msg("match is not in Waiting state")]
    NotWaiting,
    #[msg("match is full")]
    Full,
    #[msg("already joined")]
    AlreadyJoined,
    #[msg("match roster is not full")]
    NotFull,
    #[msg("caller is not a player in this match")]
    NotAPlayer,
    #[msg("match is not Active")]
    NotActive,
    #[msg("signer is not an authorized player or session key")]
    NotAuthorized,
    #[msg("match is not Finished")]
    NotFinished,
    #[msg("signer is not the winner")]
    NotWinner,
}
