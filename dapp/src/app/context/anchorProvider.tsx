import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import GibMoniIDL from '../../../../contract/target/idl/gibmoni.json'
import type { Gibmoni } from '../../../../contract/target/types/gibmoni'

export { Gibmoni, GibMoniIDL }

export const GIBMONI_PROGRAM_ID = new PublicKey(GibMoniIDL.address)

export function getGibmoniProgram(provider: AnchorProvider, address?: PublicKey): Program<Gibmoni> {
    return new Program({ ...GibMoniIDL, address: address ? address.toBase58() : GibMoniIDL.address } as Gibmoni, provider)
}

export function getGibmoniProgramId(cluster: Cluster) {
    switch (cluster) {
        case 'devnet':
            return GIBMONI_PROGRAM_ID;

        case 'testnet':
            return GIBMONI_PROGRAM_ID;

        case 'mainnet-beta':
            return GIBMONI_PROGRAM_ID;

        default:
            return GIBMONI_PROGRAM_ID;
    }
}