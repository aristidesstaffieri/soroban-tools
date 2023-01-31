use hex::FromHexError;
use sha2::{Digest, Sha256};
use soroban_env_host::xdr::{
    self, AccountEntry, AccountEntryExt, AccountId, ContractCodeEntry, ContractDataEntry,
    ExtensionPoint, Hash, InstallContractCodeArgs, LedgerEntry, LedgerEntryData, LedgerEntryExt,
    LedgerKey, LedgerKeyContractCode, LedgerKeyContractData, ScContractCode, ScObject, ScStatic,
    ScVal, SequenceNumber, StringM, Thresholds, VecM, WriteXdr,
};

pub fn contract_hash(contract: &[u8]) -> Result<Hash, xdr::Error> {
    let args_xdr = InstallContractCodeArgs {
        code: contract.try_into()?,
    }
    .to_xdr()?;
    Ok(Hash(Sha256::digest(args_xdr).into()))
}

// /// # Errors
// ///
// /// Might return an error
// pub fn ledger_snapshot_read_or_default(
//     p: impl AsRef<Path>,
// ) -> Result<LedgerSnapshot, soroban_ledger_snapshot::Error> {
//     match LedgerSnapshot::read_file(p) {
//         Ok(snapshot) => Ok(snapshot),
//         Err(soroban_ledger_snapshot::Error::Io(e)) if e.kind() == ErrorKind::NotFound => {
//             Ok(LedgerSnapshot {
//                 network_passphrase: SANDBOX_NETWORK_PASSPHRASE.as_bytes().to_vec(),
//                 ..Default::default()
//             })
//         }
//         Err(e) => Err(e),
//     }
// }

/// # Errors
///
/// Might return an error
pub fn add_contract_code_to_ledger_entries(
    entries: &mut Vec<(Box<LedgerKey>, Box<LedgerEntry>)>,
    contract: Vec<u8>,
) -> Result<Hash, xdr::Error> {
    // Install the code
    let hash = contract_hash(contract.as_slice())?;
    let code_key = LedgerKey::ContractCode(LedgerKeyContractCode { hash: hash.clone() });
    let code_entry = LedgerEntry {
        last_modified_ledger_seq: 0,
        data: LedgerEntryData::ContractCode(ContractCodeEntry {
            code: contract.try_into()?,
            ext: ExtensionPoint::V0,
            hash: hash.clone(),
        }),
        ext: LedgerEntryExt::V0,
    };
    for (k, e) in entries.iter_mut() {
        if **k == code_key {
            **e = code_entry;
            return Ok(hash);
        }
    }
    entries.push((Box::new(code_key), Box::new(code_entry)));
    Ok(hash)
}

pub fn add_contract_to_ledger_entries(
    entries: &mut Vec<(Box<LedgerKey>, Box<LedgerEntry>)>,
    contract_id: [u8; 32],
    wasm_hash: [u8; 32],
) {
    // Create the contract
    let contract_key = LedgerKey::ContractData(LedgerKeyContractData {
        contract_id: contract_id.into(),
        key: ScVal::Static(ScStatic::LedgerKeyContractCode),
    });

    let contract_entry = LedgerEntry {
        last_modified_ledger_seq: 0,
        data: LedgerEntryData::ContractData(ContractDataEntry {
            contract_id: contract_id.into(),
            key: ScVal::Static(ScStatic::LedgerKeyContractCode),
            val: ScVal::Object(Some(ScObject::ContractCode(ScContractCode::WasmRef(Hash(
                wasm_hash,
            ))))),
        }),
        ext: LedgerEntryExt::V0,
    };
    for (k, e) in entries.iter_mut() {
        if **k == contract_key {
            **e = contract_entry;
            return;
        }
    }
    entries.push((Box::new(contract_key), Box::new(contract_entry)));
}

/// # Errors
///
/// Might return an error
pub fn padded_hex_from_str(s: &str, n: usize) -> Result<Vec<u8>, FromHexError> {
    let mut decoded = vec![0u8; n];
    let padded = format!("{s:0>width$}", width = n * 2);
    hex::decode_to_slice(padded, &mut decoded)?;
    Ok(decoded)
}

/// # Errors
///
/// Might return an error
pub fn id_from_str<const N: usize>(contract_id: &str) -> Result<[u8; N], FromHexError> {
    padded_hex_from_str(contract_id, N)?
        .try_into()
        .map_err(|_| FromHexError::InvalidStringLength)
}

pub fn default_account_ledger_entry(account_id: AccountId) -> LedgerEntry {
    // TODO: Consider moving the definition of a default account ledger entry to
    // a location shared by the SDK and CLI. The SDK currently defines the same
    // value (see URL below). There's some benefit in only defining this once to
    // prevent the two from diverging, which would cause inconsistent test
    // behavior between the SDK and CLI. A good home for this is unclear at this
    // time.
    // https://github.com/stellar/rs-soroban-sdk/blob/b6f9a2c7ec54d2d5b5a1e02d1e38ae3158c22e78/soroban-sdk/src/accounts.rs#L470-L483.
    LedgerEntry {
        data: LedgerEntryData::Account(AccountEntry {
            account_id,
            balance: 0,
            flags: 0,
            home_domain: StringM::default(),
            inflation_dest: None,
            num_sub_entries: 0,
            seq_num: SequenceNumber(0),
            thresholds: Thresholds([1; 4]),
            signers: VecM::default(),
            ext: AccountEntryExt::V0,
        }),
        last_modified_ledger_seq: 0,
        ext: LedgerEntryExt::V0,
    }
}
