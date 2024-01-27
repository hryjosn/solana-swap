import { makeAutoObservable } from 'mobx'
import tokenList from "../../app/tokenList.json";
import {PhantomProvider, }from './type'
import {
  PublicKey
} from "@solana/web3.js";
class HomeStore {
  isPhantomAvailable = false
  provider: PhantomProvider|null = null
  connected = false
  payAmount = ""
  payToken = tokenList["devnet"][0].mintAddress
  pubKey: PublicKey|null = null
  receiveAmount = ""
  receiveToken = tokenList["devnet"][1].mintAddress
  receiveBalance: number = 0
  payBalance: number = 0
  tokenDecimal: number = 0
  poolWalletSolAddr: string = ''
  constructor() {
    makeAutoObservable(this)
  }


}

export default HomeStore

