use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;
use crate::errors::Error;

pub const ED25519_PROGRAM_ID: Pubkey = pubkey!("Ed25519SigVerify111111111111111111111111111");
pub const ORACLE_PUBKEY: Pubkey = pubkey!("AYoKgU74nVcwYQjP3CMqw5oMHMjdUNXyqPaW5eXRr57y");

pub fn verify_ed25519_ix(
    instructions_sysvar: &AccountInfo,
    ix_index: u8,
    expected_public_key: &[u8; 32],
    expected_message: &[u8],
    expected_signature: &[u8],
) -> Result<()> {
    let ix = load_instruction_at_checked(ix_index as usize, instructions_sysvar)?;

    require_keys_eq!(
        ix.program_id,
        ED25519_PROGRAM_ID,
        Error::InvalidEd25519Program
    );

    let data = ix.data;

    require!(data.len() >= 16, Error::InvalidEd25519DataLength);

    require!(data[0] == 1, Error::InvalidNumSignatures);

    let sig_offset    = u16::from_le_bytes([data[2],  data[3]])  as usize;
    let pubkey_offset = u16::from_le_bytes([data[6],  data[7]])  as usize;
    let msg_offset    = u16::from_le_bytes([data[10], data[11]]) as usize;
    let msg_size      = u16::from_le_bytes([data[12], data[13]]) as usize;
    let sig_ix_index    = u16::from_le_bytes([data[4],  data[5]]);
    let pubkey_ix_index = u16::from_le_bytes([data[8],  data[9]]);
    let msg_ix_index    = u16::from_le_bytes([data[14], data[15]]);
    
   require!(
        (sig_ix_index == ix_index as u16 || sig_ix_index == u16::MAX) &&
        (pubkey_ix_index == ix_index as u16 || pubkey_ix_index == u16::MAX) &&
        (msg_ix_index == ix_index as u16 || msg_ix_index == u16::MAX),
        Error::InvalidEd25519IxIndex  
    );

    let ix_pubkey = data
        .get(pubkey_offset..pubkey_offset + 32)
        .ok_or(Error::InvalidEd25519DataLength)?;

    let ix_sig = data
        .get(sig_offset..sig_offset + 64)
        .ok_or(Error::InvalidEd25519DataLength)?;

    let ix_msg = data
        .get(msg_offset..msg_offset + msg_size)
        .ok_or(Error::InvalidEd25519DataLength)?;

    require!(ix_pubkey == expected_public_key, Error::OraclePubkeyMismatch);
    require!(ix_msg    == expected_message,     Error::OracleMessageMismatch);
    require!(ix_sig    == expected_signature,   Error::OracleSignatureMismatch);

    Ok(())
}