"use client";

import Button from "@mui/material/Button";
import { useState } from "react";

export default function Home() {
  const [payAmount, setPayAmount] = useState("");
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="border-2 p-1 rounded-lg border-black border-solid w-[480px]">
        <div className="bg-gray-300 rounded-lg py-3 px-2 mb-1">
          <div className="text-xs">You pay</div>
          <div>
            <input
              className="border-0 bg-transparent text-lg border-solid border-b-2 outline-none"
              value={payAmount}
              onChange={(e) => {
                setPayAmount(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="bg-gray-300 rounded-lg py-3 px-2 mb-1 flex-1">
          <div className="text-xs">You Receive</div>
          <div>
            <input
              className="border-0 bg-transparent text-lg border-solid border-b-2 outline-none"
              value={payAmount}
              onChange={(e) => {
                setPayAmount(e.target.value);
              }}
            />
          </div>
        </div>
        <Button variant="contained" color="primary" className="w-full">
          Connect Wallet
        </Button>
      </div>
    </div>
  );
}
