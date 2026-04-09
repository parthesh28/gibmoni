import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import GibMoniIDL from '../../idl/gibmoni.json'

export type Gibmoni = Idl & Record<string, any>
export { GibMoniIDL }

const gibmoniIdl = GibMoniIDL as Idl & { address: string }

export const GIBMONI_PROGRAM_ID = new PublicKey(gibmoniIdl.address)

export function getGibmoniProgram(provider: AnchorProvider, address?: PublicKey): any {
    return new Program({ ...gibmoniIdl, address: address ? address.toBase58() : gibmoniIdl.address } as Idl, provider) as any
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