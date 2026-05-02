use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions::load_instruction_at_checked;

use crate::errors::Error;

pub const ED25519_PROGRAM_ID: Pubkey = pubkey!("Ed25519SigVerify111111111111111111111111111");
use anchor_lang::prelude::*;

pub const ORACLE_PUBKEY: Pubkey = pubkey!("AYoKgU74nVcwYQjP3CMqw5oMHMjdUNXyqPaW5eXRr57y");


pub fn verify_ed25519_ix(
    instructions_sysvar: &AccountInfo,
    expected_public_key: &[u8],
    expected_message: &[u8],
    expected_signature: &[u8],
) -> Result<()> {
    let ix = load_instruction_at_checked(0, instructions_sysvar)?;

    // 2. Verify it is the Ed25519 program using our hardcoded ID
    require_keys_eq!(
        ix.program_id, 
        ED25519_PROGRAM_ID, 
        Error::InvalidEd25519Program
    );

    let data = ix.data;

    require!(data.len() >= 16, Error::InvalidEd25519DataLength);
    require!(data[0] == 1, Error::InvalidNumSignatures);

    let sig_offset = u16::from_le_bytes([data[2], data[3]]) as usize;
    let pubkey_offset = u16::from_le_bytes([data[6], data[7]]) as usize;
    let msg_offset = u16::from_le_bytes([data[10], data[11]]) as usize;
    let msg_size = u16::from_le_bytes([data[12], data[13]]) as usize;

    let ix_pubkey = &data[pubkey_offset..pubkey_offset + 32];
    require!(
        ix_pubkey == expected_public_key, 
        Error::OraclePubkeyMismatch
    );

    let ix_msg = &data[msg_offset..msg_offset + msg_size];
    require!(
        ix_msg == expected_message, 
        Error::OracleMessageMismatch
    );

    let ix_sig = &data[sig_offset..sig_offset + 64];
    require!(
        ix_sig == expected_signature, 
        Error::OracleSignatureMismatch
    );

    Ok(())
}