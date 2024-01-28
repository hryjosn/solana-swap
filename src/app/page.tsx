"use client";
import { observer } from "mobx-react-lite";

import Button from "@mui/material/Button";
import { useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import FormControl from "@mui/material/FormControl";
import tokenList from "./tokenList.json";
import { rootStore } from "~/store";
import { WindowWithSolana } from "~/store/HomeStore/type";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { runInAction } from "mobx";

const Home = () => {
  const { homeStore } = rootStore;
  const {
    payBalance,
    receiveBalance,
    isPhantomAvailable,
    provider,
    connected,
    swapTokenAmountInOut,
    payToken,
    swapToken,
    receiveToken,
    setExchangeRate,
    exchangeRate,
    isLoading,
  } = homeStore;
  console.log("exchangeRate>", exchangeRate);
  const getTokenBalance = async (
    tokenAccount: PublicKey,
    wallet: PublicKey
  ) => {
    const mintTokenAcc = new PublicKey(tokenAccount);
    const userTokenAcc = await getAssociatedTokenAddress(
      mintTokenAcc,
      wallet!,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const connection = await connectWallet();

    const mintTokenAccInfo = await connection.getParsedAccountInfo(
      mintTokenAcc
    );
    const decimals = (mintTokenAccInfo.value?.data as any)?.parsed.info
      .decimals;
    return (
      Number((await getAccount(connection, userTokenAcc)).amount) /
      Math.pow(10, Number(decimals))
    );
  };
  useEffect(() => {
    if ("solana" in window) {
      const solWindow = window as WindowWithSolana;
      if (solWindow?.solana?.isPhantom) {
        runInAction(() => {
          homeStore.provider = solWindow.solana;
        });
        solWindow.solana?.on("connect", (wallet: PublicKey) => {
          runInAction(async () => {
            homeStore.connected = true;
            homeStore.pubKey = wallet;

            homeStore.payBalance = await getTokenBalance(
              new PublicKey(payToken.mintAddress),
              wallet
            );
            homeStore.receiveBalance = await getTokenBalance(
              new PublicKey(receiveToken.mintAddress),
              wallet
            );
          });
          setExchangeRate();
        });
        solWindow.solana?.on("disconnect", () => {
          console.log("disconnect event");
          runInAction(() => {
            homeStore.connected = false;
            homeStore.pubKey = null;
          });
        });
        runInAction(() => {
          homeStore.isPhantomAvailable = true;
        });
        // Attempt an eager connection
        solWindow.solana.connect({ onlyIfTrusted: true });
      }
    }
  }, []);

  const connectHandler: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    console.log(`connect handler`);
    provider?.connect().catch((err) => {
      console.error("connect ERROR:", err);
    });
  };

  const disconnectHandler: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    console.log("disconnect handler");
    provider?.disconnect().catch((err) => {
      console.error("disconnect ERROR:", err);
    });
  };
  async function connectWallet(): Promise<Connection> {
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    const version = await connection.getVersion();
    console.log("Connection to cluster established:", version);
    return connection;
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="border-2 p-1 rounded-lg border-black border-solid w-[480px]">
        <div className="bg-gray-300 rounded-lg py-3 px-2 mb-1">
          <div className="text-xs">
            You pay
            <span className="ml-2">(balance: {payBalance})</span>
          </div>
          <div className="flex">
            <input
              disabled={!exchangeRate || isLoading}
              className="border-0 bg-transparent text-lg border-solid border-b-2 outline-none flex-1"
              value={swapTokenAmountInOut[0]}
              onChange={(e) => {
                runInAction(() => {
                  homeStore.swapTokenAmountInOut[0] = e.target.value;
                  homeStore.swapTokenAmountInOut[1] = String(
                    Number(e.target.value) * exchangeRate
                  );
                });
              }}
            />
            <FormControl variant="standard">
              <Select
                value={payToken.tokenName}
                onChange={(e) => {
                  runInAction(() => {
                    homeStore.swapTokenAmountInOut = ["0", "0"];
                    homeStore.payToken = tokenList["devnet"].find(
                      (token) => token.tokenName === e.target.value
                    )!;
                  });
                  setExchangeRate();
                }}
              >
                {tokenList["devnet"].map((token, index) => (
                  <MenuItem key={`MenuItem_$${index}`} value={token.tokenName}>
                    {token.tokenName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
        <div className="bg-gray-300 rounded-lg py-3 px-2 mb-1 flex-1">
          <div className="text-xs">You Receive: ({receiveBalance})</div>
          <div className="flex">
            <input
              disabled={!exchangeRate}
              className="border-0 bg-transparent text-lg border-solid border-b-2 outline-none flex-1"
              value={homeStore.swapTokenAmountInOut[1]}
              onChange={(e) => {
                runInAction(() => {
                  homeStore.swapTokenAmountInOut[1] = e.target.value;
                  homeStore.swapTokenAmountInOut[0] = String(
                    Number(e.target.value) / exchangeRate
                  );
                });
              }}
            />
            <FormControl variant="standard">
              <Select
                value={receiveToken.tokenName}
                onChange={(e) => {
                  homeStore.swapTokenAmountInOut = ["0", "0"];
                  homeStore.receiveToken = tokenList["devnet"].find(
                    (token) => token.tokenName === e.target.value
                  )!;
                  setExchangeRate();
                }}
              >
                {tokenList["devnet"].map((token, index) => (
                  <MenuItem key={`MenuItem_$${index}`} value={token.tokenName}>
                    {token.tokenSymbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
        {isPhantomAvailable ? (
          <>
            {connected ? (
              <div className="mb-1">
                <Button
                  variant="contained"
                  color="primary"
                  className="w-full"
                  // disabled={connected}
                  onClick={() => {
                    swapToken(1);
                  }}
                >
                  Swap
                </Button>
              </div>
            ) : (
              <Button
                variant="contained"
                color="primary"
                className="w-full"
                disabled={connected}
                onClick={connectHandler}
              >
                Connect to Phantom
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              className="w-full"
              disabled={!connected}
              onClick={disconnectHandler}
            >
              Disconnect from Phantom
            </Button>
          </>
        ) : (
          <>
            <p>
              Opps!!! Phantom is not available. Go get it{" "}
              <a href="https://phantom.app/">https://phantom.app/</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
export default observer(Home);
