"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, Send, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { BUILDER_REWARDS_ABI, CONTRACT_ADDRESS, DISTRIBUTION_PERCENTAGES, MANTLE_CHAIN } from "@/lib/contract";

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

interface DistributeButtonProps {
  className?: string;
}

export function DistributeButton({ className }: DistributeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [distributionStatus, setDistributionStatus] = useState<"idle" | "pending" | "confirming" | "success" | "error">("idle");

  // Check if wallet is connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length === 0) {
          setIsConnected(false);
          setAccount(null);
        } else {
          setAccount(accs[0]);
          checkOwnership(accs[0]);
        }
      };

      const handleChainChanged = (chainIdHex: unknown) => {
        setChainId(parseInt(chainIdHex as string, 16));
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  async function checkConnection() {
    if (!window.ethereum) return;

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[];

      if (accounts.length > 0) {
        setIsConnected(true);
        setAccount(accounts[0]);
        await checkOwnership(accounts[0]);
        await fetchContractBalance();
        
        const chainIdHex = (await window.ethereum.request({
          method: "eth_chainId",
        })) as string;
        setChainId(parseInt(chainIdHex, 16));
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setError("Please install MetaMask or another Web3 wallet");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      setIsConnected(true);
      setAccount(accounts[0]);
      await checkOwnership(accounts[0]);
      await fetchContractBalance();

      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;
      setChainId(parseInt(chainIdHex, 16));
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  }

  async function switchToMantle() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${MANTLE_CHAIN.id.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      // Chain not added, add it
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${MANTLE_CHAIN.id.toString(16)}`,
              chainName: MANTLE_CHAIN.name,
              nativeCurrency: MANTLE_CHAIN.nativeCurrency,
              rpcUrls: [MANTLE_CHAIN.rpcUrls.default.http[0]],
              blockExplorerUrls: [MANTLE_CHAIN.blockExplorers.default.url],
            },
          ],
        });
      }
    }
  }

  async function checkOwnership(userAddress: string) {
    if (!CONTRACT_ADDRESS) return;

    try {
      // Create a simple call to get the owner
      const data = "0x8da5cb5b"; // owner() function selector
      
      const result = (await window.ethereum?.request({
        method: "eth_call",
        params: [
          {
            to: CONTRACT_ADDRESS,
            data: data,
          },
          "latest",
        ],
      })) as string;

      // Decode the address from the result
      const ownerAddress = "0x" + result.slice(26).toLowerCase();
      setIsOwner(ownerAddress === userAddress.toLowerCase());
    } catch (err) {
      console.error("Error checking ownership:", err);
    }
  }

  async function fetchContractBalance() {
    if (!CONTRACT_ADDRESS || !window.ethereum) return;

    try {
      const balance = (await window.ethereum.request({
        method: "eth_getBalance",
        params: [CONTRACT_ADDRESS, "latest"],
      })) as string;

      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / 1e18;
      setContractBalance(balanceInEth.toFixed(4));
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }

  async function distributeRewards() {
    if (!window.ethereum || !account) return;

    setIsDistributing(true);
    setDistributionStatus("pending");
    setError(null);
    setTxHash(null);

    try {
      // distributeRewards() function selector
      const data = "0x6f4a2cd0";

      const hash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: CONTRACT_ADDRESS,
            data: data,
          },
        ],
      })) as string;

      setTxHash(hash);
      setDistributionStatus("confirming");
      
      // Wait for confirmation and refresh balance
      setTimeout(() => {
        setDistributionStatus("success");
        fetchContractBalance();
        setIsDistributing(false);
      }, 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Transaction failed");
      setDistributionStatus("error");
      setIsDistributing(false);
    }
  }

  const isCorrectChain = chainId === MANTLE_CHAIN.id;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className={`gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold ${className}`}
          size="lg"
        >
          <Send className="h-4 w-4" />
          Distribute Rewards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {/* Distributing State - Full Screen Overlay */}
        {(distributionStatus === "pending" || distributionStatus === "confirming") && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-6 p-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                </div>
                <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/30 animate-ping" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-emerald-400">
                  {distributionStatus === "pending" ? "Distributing Rewards..." : "Confirming Transaction..."}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {distributionStatus === "pending" 
                    ? "Please confirm the transaction in your wallet" 
                    : "Waiting for blockchain confirmation"}
                </p>
              </div>

              {txHash && (
                <div className="bg-muted/50 rounded-lg p-4 w-full max-w-sm">
                  <p className="text-xs text-muted-foreground mb-2">Transaction Hash:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-emerald-400 break-all">
                      {txHash}
                    </code>
                  </div>
                  <a
                    href={`https://sepolia.mantlescan.xyz/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-3"
                  >
                    View on Mantlescan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success State - Full Screen Overlay */}
        {distributionStatus === "success" && txHash && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-6 p-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-emerald-400">
                  Rewards Distributed! 🎉
                </h3>
                <p className="text-sm text-muted-foreground">
                  Successfully sent to top 10 builders
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 w-full max-w-sm">
                <p className="text-xs text-muted-foreground mb-2">Transaction Hash:</p>
                <code className="text-xs font-mono text-emerald-400 break-all block mb-3">
                  {txHash}
                </code>
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
                >
                  View on Mantlescan
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <Button
                onClick={() => {
                  setDistributionStatus("idle");
                  setTxHash(null);
                }}
                variant="outline"
                className="mt-2"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-400" />
            Distribute Builder Rewards
          </DialogTitle>
          <DialogDescription>
            Distribute ETH rewards to the top 10 Mantle builders based on their ranking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contract Info */}
          {CONTRACT_ADDRESS ? (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contract Balance</span>
                <span className="font-mono font-bold text-emerald-400">{contractBalance} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contract</span>
                <a
                  href={`https://sepolia.mantlescan.xyz/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
              <p className="text-sm text-yellow-400">
                Contract not deployed yet. Deploy the contract first and set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env.local
              </p>
            </div>
          )}

          {/* Distribution Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Distribution Scale</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DISTRIBUTION_PERCENTAGES.slice(0, 6).map((item) => (
                <div key={item.rank} className="flex justify-between">
                  <span className="text-muted-foreground">Rank {item.rank}</span>
                  <Badge variant="outline" className="font-mono">
                    {item.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <Button
              onClick={connectWallet}
              disabled={isLoading}
              className="w-full gap-2"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect Wallet
            </Button>
          ) : !isCorrectChain ? (
            <Button onClick={switchToMantle} className="w-full gap-2" variant="outline">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              Switch to Mantle Network
            </Button>
          ) : !isOwner ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Only the contract owner can distribute rewards
              </p>
            </div>
          ) : (
            <Button
              onClick={distributeRewards}
              disabled={isDistributing || parseFloat(contractBalance) === 0}
              className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Send className="h-4 w-4" />
              Distribute {contractBalance} ETH
            </Button>
          )}

          {/* Connected Account */}
          {isConnected && account && !isDistributing && (
            <div className="text-xs text-center text-muted-foreground">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
              {isOwner && (
                <Badge variant="outline" className="ml-2 text-emerald-400 border-emerald-400/50">
                  Owner
                </Badge>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && distributionStatus === "error" && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400">{error}</p>
              <Button
                onClick={() => {
                  setDistributionStatus("idle");
                  setError(null);
                }}
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
