var express = require("express");
var router = express.Router();
const helper = require("../helper/customHelper");
const ethers = require("ethers");
// require('dotenv').config();
const upload = require("../middleWare/upload");
var axios = require("axios");
const dotenv = require("dotenv");
const convert = require("ether-converter");

dotenv.config();
const Web3 = require("web3");
const abi = require("../Router2abi.json");

const {
  WETH,
  ChainId,
  Route,
  Router,
  Fetcher,
  Trade,
  TokenAmount,
  TradeType,
  Token,
  Percent,
} = require("@pancakeswap/sdk");
// const { WETH, ChainId, Route, Router, Fetcher, Trade, TokenAmount, TradeType, Token, Percent } = require('@pancakeswap-libs/sdk');
const pancakeSwapRouter2Address = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"; //mainnet address
const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://bsc-dataseed1.binance.org/");

router.post("/calculateGassLimit", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.numTokens &&
    req.body.symbol &&
    req.body.receiverAddress &&
    req.body.providerType
  ) {
    let contractAddress = await helper.getContractAddress(
      req.body.symbol,
      req.body.providerType
    );

    if (contractAddress) {
      let Web3Client = await helper.getWebClient(req.body.providerType);
      let contract = await helper.getContractAddressInstanse(
        contractAddress,
        Web3Client
      );
      let response = await helper.countNonceAndData(
        req.body.walletAddress,
        req.body.numTokens,
        req.body.receiverAddress,
        contract,
        Web3Client
      );

      let nonce = response.nonce;
      let data = response.data;

      let gaseLimit = await helper.calculateGassLimitEstimate(
        req.body.walletAddress,
        nonce,
        contractAddress,
        data,
        Web3Client
      );
      let responseGass = {
        gaseLimit: gaseLimit,
      };
      res.status(200).send(responseGass);
    } else {
      let response = {
        message: "Contract address is not available against this symbol!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/sendToken", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.numTokens &&
    req.body.symbol &&
    req.body.receiverAddress &&
    req.body.senderPrivateKey &&
    req.body.providerType
  ) {
    let contractAddress = await helper.getContractAddress(
      req.body.symbol,
      req.body.providerType
    );
    if (contractAddress) {
      let Web3Client = await helper.getWebClient(req.body.providerType);

      let contract = await helper.getContractAddressInstanse(
        contractAddress,
        Web3Client
      );
      let response = await helper.countNonceAndData(
        req.body.walletAddress,
        req.body.numTokens,
        req.body.receiverAddress,
        contract,
        Web3Client
      );
      let nonce = response.nonce;
      let data = response.data;

      let gaseLimit = await helper.calculateGassLimit(
        req.body.walletAddress,
        nonce,
        contractAddress,
        data,
        Web3Client
      );

      console.log("gaseLimit", gaseLimit);
      let balance = await helper.getWalletAddressBalance(
        req.body.walletAddress,
        contractAddress,
        Web3Client
      );
      console.log("balance of wallet are =====", balance);

      if (balance < req.body.numTokens) {
        let response = {
          message: `Insufficient balance!!!`,
        };
        res.status(404).send(response);
      } else {
        let trasctionData = await helper.transferTokenToOtherWallets(
          gaseLimit,
          data,
          req.body.walletAddress,
          nonce,
          req.body.senderPrivateKey,
          contractAddress,
          Web3Client
        );
        res.status(200).send(trasctionData);
      }
    } else {
      let response = {
        message: "Contract address is not available against this symbol!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/getBalance", async (req, res) => {
  if (req.body.symbol && req.body.walletAddress && req.body.providerType) {
    let contractAddress = await helper.getContractAddress(
      req.body.symbol,
      req.body.providerType
    );
    if (contractAddress.length > 0) {
      let Web3Client = await helper.getWebClient(req.body.providerType);
      let balance = await helper.getWalletAddressBalance(
        req.body.walletAddress,
        contractAddress,
        Web3Client
      );

      let response = {
        balance: balance,
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Payload missing!!!!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload missing!!!!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/addNewToken", async (req, res) => {
  if (
    req.body.symbol &&
    req.body.providerType &&
    req.body.type &&
    req.body.url
  ) {
    let Web3Client = await helper.getWebClient(req.body.providerType);
    if (req.body.type == "token") {
      let contract = await helper.getContractAddressInstanse(
        req.body.contractAddress,
        Web3Client
      );
      let checkStatus = await helper.isContractAddressIsValid(
        req.body.symbol,
        contract
      );
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaa", checkStatus);
      helper.addContractAddress(
        req.body.symbol,
        req.body.contractAddress,
        req.body.providerType,
        req.body.type,
        req.body.url
      );
      res.status(checkStatus.status).send(checkStatus);
    } else if (req.body.type == "coin") {
      helper.addCoin(
        req.body.symbol,
        req.body.providerType,
        "coin",
        req.body.url
      );
      res.status(200).send({ message: "Added", status: 200 });
    } else {
      res.status(400).send({ message: "type not valid" });
    }
  } else {
    let response = {
      message: "Payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.get("/getUserToken", async (req, res) => {
  let data = await helper.getRecord();
  let response = {
    data,
  };
  res.status(200).send(response);
});

router.post("/sendCoin", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.receiverAddress &&
    req.body.amount &&
    req.body.privateKey &&
    req.body.providerType
  ) {
    let walletAddress = req.body.walletAddress;
    let privateKey = req.body.privateKey;
    let receiverAddress = req.body.receiverAddress;
    let amount = req.body.amount;

    let Web3Client = await helper.getWebClient(req.body.providerType);
    const isvalid = Web3Client.utils.isAddress(receiverAddress);
    console.log(isvalid);
    if (!isvalid) {
      //Web3Client
      res.status(400).json({
        error: `This wallet address is not valid. Kindly confirm the address and try again.`,
      });
    } else {
      try {
        //get ether balance before transaction
        const ethBalance = await Web3Client.eth.getBalance(walletAddress);
        console.log(ethBalance);
        // convert amount to ether from wei
        const ethAmount = Web3Client.utils.fromWei(ethBalance, "ether");
        //cgeck sending amount is greater then ether balance
        if (ethAmount > amount) {
          const count = await Web3Client.eth.getTransactionCount(
            walletAddress,
            "latest"
          );
          let etherValue = Web3Client.utils.toWei(amount.toString(), "ether");

          const transaction = {
            to: receiverAddress,
            value: etherValue,
            gas: 30000,
            nonce: count,
            // optional data field to send message or execute smart contract
          };

          const signedTx = await Web3Client.eth.accounts.signTransaction(
            transaction,
            privateKey
          );
          Web3Client.eth.sendSignedTransaction(signedTx.rawTransaction);
          // deductTransactionFee(walletDetail.user_id, feeInSwet)
          return res
            .status(200)
            .json({ transactionHash: signedTx.transactionHash });
        } else {
          let response = {
            message: "insufficent fund!!!",
          };
          res.status(404).send(response);
        }
      } catch (error) {
        console.log(error);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    }
  } else {
    let response = {
      message: "Payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/calculateGassFeeCoin", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.receiverAddress &&
    req.body.amount &&
    req.body.providerType
  ) {
    console.log("asim=========================");
    let Web3Client = await helper.getWebClient(req.body.providerType);
    if (Web3Client == false) {
      res.status(400).json({ error: `Provider type is not valid!!!` });
    }
    const isvalid = await Web3Client.utils.isAddress(req.body.receiverAddress);
    console.log("asim------------");

    if (!isvalid) {
      console.log("if asim $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");

      res.status(400).json({
        error: `This wallet address is not valid. Kindly confirm the address and try again.`,
      });
    } else {
      console.log(
        "else asim ========================OOOOOOOOOOOOOOOOOOOOOOOOOOOOOO"
      );

      let fee = await helper.estimateGasForEthTransaction(
        req.body.walletAddress,
        req.body.receiverAddress,
        req.body.amount,
        Web3Client
      );
      res.status(fee.status).send(fee);
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

router.post("/getCoinBalance", async (req, res) => {
  if (req.body.walletAddress && req.body.providerType) {
    try {
      let Web3Client = await helper.getWebClient(req.body.providerType);
      const ethBalance = await Web3Client.eth.getBalance(
        req.body.walletAddress
      );
      console.log(ethBalance);
      // convert amount to ether from wei
      const ethAmount = Web3Client.utils.fromWei(ethBalance, "ether");
      let response = {
        balance: ethAmount,
      };
      res.status(200).send(response);
    } catch (e) {
      res.status(404).send({ message: e });
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

//pancakeswap
router.post("/coinToTokenPrice", async (req, res) => {
  if (req.body.amount && req.body.toSymbol && req.body.providerType) {
    let etherAmount = parseFloat(req.body.amount);
    let toSymbol = req.body.toSymbol;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    console.log("========", contractAddress);
    if (contractAddress) {
      try {
        var tradeAmount = ethers.utils.parseEther(String(etherAmount));
        const chainId = ChainId.MAINNET;
        const weth = WETH[chainId];

        const tokenAddress = contractAddress;
        const swapToken = await Fetcher.fetchTokenData(
          chainId,
          tokenAddress,
          provider
        );
        console.log("swapToken", swapToken);
        const pair = await Fetcher.fetchPairData(swapToken, weth, provider);
        const route = await new Route([pair], weth);
        const trade = await new Trade(
          route,
          new TokenAmount(weth, tradeAmount),
          TradeType.EXACT_INPUT
        );
        const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
        const tokenPrice = route.midPrice.toSignificant(6);
        let finalPrice = Number(etherAmount) * Number(tokenPrice);
        let executionPrice = trade.executionPrice.toSignificant(6);
        finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

        console.log("1 token = ", tokenPriceInEth);
        console.log("total token by given by eth= ", finalPrice);
        console.log("Minimum received= ", executionPrice * etherAmount);

        const minimumReceived = executionPrice * etherAmount;
        const result = {
          tokenPriceInEth: tokenPriceInEth,
          tokenCalculate: finalPrice,
          minimumReceived: minimumReceived,
        };
        return res.status(200).json(result);
      } catch (error) {
        console.log(error.message);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    } else {
      let response = {
        message: "Contract address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/coinToTokenSwap", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.toSymbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType &&
    req.body.percentage
  ) {
    let privateKey = req.body.privateKey;
    let toSymbol = req.body.toSymbol;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    if (contractAddress) {
      var tradeAmount = ethers.utils.parseEther(String(etherAmount));
      const chainId = ChainId.MAINNET;
      const weth = WETH[chainId];

      const addresses = {
        WBNB: weth.address,
        BUSD: contractAddress,
        PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
      };
      const [WBNB, BUSD] = await Promise.all(
        [addresses.WBNB, addresses.BUSD].map(
          (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
        )
      );
      const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

      const route = await new Route([pair], WBNB);
      const trade = await new Trade(
        route,
        new TokenAmount(WBNB, tradeAmount),
        TradeType.EXACT_INPUT
      );

      const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
      const tokenPrice = route.midPrice.toSignificant(6);
      // set Tolerance 0.5%
      const slippageTolerance = new Percent(
        req.body.percentage ? req.body.percentage : "50",
        "10000"
      ); //10 bips 1 bip = 0.001%
      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
      //set path of token and ether
      const path = [weth.address, BUSD.address];
      const to = walletAddress;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw;

      const singer = new ethers.Wallet(privateKey);

      const account = singer.connect(provider);
      const PANCAKE_ROUTER = new ethers.Contract(
        pancakeSwapRouter2Address,
        abi,
        account
      );
      try {
        const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
          String(amountOutMin),
          path,
          to,
          deadline,
          { value: String(value), gasPrice: 5.5e10 }
        );

        const receipt = await tx.wait();
        console.log(`Tx-hash: ${tx.hash}`);
        console.log(`Tx was mined in block: ${receipt.blockNumber}`);

        let response = {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
        return res.status(200).json(response);
      } catch (error) {
        return res.status(400).json({ error: error.reason });
      }
    } else {
      let response = {
        message: "Contract Address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

// router.post("/coinToTokenSwap_testing", async (req, res) => {
//   if (
//     req.body.privateKey &&
//     req.body.toSymbol &&
//     req.body.amount &&
//     req.body.walletAddress &&
//     req.body.providerType &&
//     req.body.percentage
//   ) {
//     let privateKey = req.body.privateKey;
//     let toSymbol = req.body.toSymbol;
//     let etherAmount = req.body.amount;
//     let walletAddress = req.body.walletAddress;
//
//     let contractAddress = await helper.getContractAddress(
//       toSymbol,
//       req.body.providerType
//     );
//     if (contractAddress) {
//       var tradeAmount = ethers.utils.parseEther(String(etherAmount));
//       const chainId = ChainId.MAINNET;
//       const weth = WETH[chainId];
//
//       const addresses = {
//         WBNB: weth.address,
//         BUSD: contractAddress,
//         PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
//       };
//       const [WBNB, BUSD] = await Promise.all(
//         [addresses.WBNB, addresses.BUSD].map(
//           (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
//         )
//       );
//       const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
//
//       const route = await new Route([pair], WBNB);
//       const trade = await new Trade(
//         route,
//         new TokenAmount(WBNB, tradeAmount),
//         TradeType.EXACT_INPUT
//       );
//
//       const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
//       const tokenPrice = route.midPrice.toSignificant(6);
//       // set Tolerance 0.5%
//       const slippageTolerance = new Percent(
//         req.body.percentage ? req.body.percentage : "50",
//         "10000"
//       ); //10 bips 1 bip = 0.001%
//       const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
//       // //set path of token and ether
//       // const path = [weth.address, BUSD.address];
//       // const to = walletAddress;
//       // const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
//       // const value = trade.inputAmount.raw;
//       //
//       // const singer = new ethers.Wallet(privateKey);
//       //
//       // const account = singer.connect(provider);
//       // const PANCAKE_ROUTER = new ethers.Contract(
//       //   pancakeSwapRouter2Address,
//       //   abi,
//       //   account
//       // );
//       try {
//         return res.status(200).json({ response: amountOutMin.toString() });
//       } catch (error) {
//         return res.status(400).json({ error: error.reason });
//       }
//     } else {
//       let response = {
//         message: "Contract Address not exists!!!",
//       };
//       res.status(404).send(response);
//     }
//   } else {
//     let response = {
//       message: "Payload Missing",
//     };
//     res.status(404).send(response);
//   }
// });

router.post("/tokenToTokenPrice1", async (req, res) => {
  if (
    req.body.amount &&
    req.body.toSymbol &&
    req.body.symbol &&
    req.body.providerType
  ) {
    let etherAmount = parseFloat(req.body.amount);
    let toSymbol = req.body.toSymbol;
    let fromSymbol = req.body.symbol;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    let fromcontractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    console.log("contractAddress", contractAddress);
    console.log("fromcontractAddress", fromcontractAddress);
    if (contractAddress && fromcontractAddress) {
      try {
        // chain id for test net
        const chainId = ChainId.MAINNET;
        //token address to swap
        var amountEth = ethers.utils.parseEther(String(etherAmount));
        const addresses = {
          WBNB: fromcontractAddress, //'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
          BUSD: contractAddress, //'0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
          PANCAKE_ROUTER: pancakeSwapRouter2Address,
        };
        const [WBNB, BUSD] = await Promise.all(
          [addresses.WBNB, addresses.BUSD].map(
            (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
          )
        );
        //fetch ether through chain id
        const weth = WETH[chainId];
        const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
        const route = new Route([pair], WBNB);
        const trade = new Trade(
          route,
          new TokenAmount(WBNB, String(amountEth)),
          TradeType.EXACT_INPUT
        );
        const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
        const tokenPrice = route.midPrice.toSignificant(6);
        let finalPrice = Number(etherAmount) * Number(tokenPrice);
        let executionPrice = trade.executionPrice.toSignificant(6);
        finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

        console.log("1 token = ", tokenPriceInEth);
        console.log("total token by given by eth= ", finalPrice);
        console.log("Minimum received= ", executionPrice * etherAmount);

        const minimumReceived = executionPrice * etherAmount;
        const result = {
          tokenPriceInEth: tokenPriceInEth,
          tokenCalculate: finalPrice,
          minimumReceived: minimumReceived,
        };
        return res.status(200).json(result);
      } catch (error) {
        console.log(error);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    } else {
      let response = {
        message: "Contract address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToTokenPrice", async (req, res) => {
  if (
    req.body.amount &&
    req.body.toSymbol &&
    req.body.symbol &&
    req.body.providerType
  ) {
    let etherAmount = parseFloat(req.body.amount);
    let fromSymbol = req.body.symbol;
    let toSymbol = req.body.toSymbol;
    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    let fromcontractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    console.log("to-contractAddress----", contractAddress);
    console.log("fromcontractAddress----", fromcontractAddress);
    if (contractAddress && fromcontractAddress) {
      if (
        (toSymbol === "BUSD" && fromSymbol === "LGBT") ||
        (fromSymbol === "BUSD" && toSymbol === "LGBT")
      ) {
        try {
          var tradeAmount = ethers.utils.parseEther(String(etherAmount));

          console.log("tradeAmount  ---", tradeAmount);
          const chainId = ChainId.MAINNET;
          //console.log(chainId);
          const weth = WETH[chainId];
          //console.log(weth);
          const addresses = {
            WBNB: contractAddress,
            BUSD: weth.address,
            PANCAKE_ROUTER: pancakeSwapRouter2Address, //router 2 address
          };
          const [WBNB, BUSD] = await Promise.all(
            [addresses.WBNB, addresses.BUSD].map(
              (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
            )
          );

          console.log("WBNB, BUSDWBNB, BUSDWBNB, BUSD ", WBNB, BUSD);
          const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
          console.log("pppppppppppppppppppppppppppppppp", pair);
          const route = await new Route([pair], WBNB);
          console.log("================= route=========", route);
          const trade = await new Trade(
            route,
            new TokenAmount(WBNB, tradeAmount),
            TradeType.EXACT_INPUT
          );
          console.log("contractAddress==========================");
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          console.log("tokenPriceInEth ---", tokenPriceInEth);
          const tokenPrice = route.midPrice.toSignificant(6);
          console.log("tokenPrice ---", tokenPrice);
          let finalPrice = Number(etherAmount) * Number(tokenPrice);
          console.log("finalPrice ---", finalPrice);
          finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;
          var tradeAmountNew = ethers.utils.parseEther(String(tokenPriceInEth));
          const tokenAddressNew = fromcontractAddress;
          const swapToken = await Fetcher.fetchTokenData(
            chainId,
            tokenAddressNew,
            provider
          );
          console.log("swapToken", swapToken);
          const pairnew = await Fetcher.fetchPairData(
            swapToken,
            weth,
            provider
          );
          const routenew = await new Route([pairnew], weth);
          const tradenew = await new Trade(
            routenew,
            new TokenAmount(weth, tradeAmountNew),
            TradeType.EXACT_INPUT
          );
          const tokenPriceInEthnew = route.midPrice.invert().toSignificant(6);
          const tokenPricenew = route.midPrice.toSignificant(6);
          let finalPricenew = Number(etherAmount) * Number(tokenPricenew);
          let executionPricenew = tradenew.executionPrice.toSignificant(6);
          finalPricenew =
            Math.round((finalPricenew + Number.EPSILON) * 100) / 100;

          console.log("1 token = ", tokenPriceInEthnew);
          console.log("total token by given by eth= ", finalPrice);
          console.log("Minimum received= ", executionPricenew * etherAmount);

          const minimumReceived = executionPricenew * etherAmount;
          const result = {
            tokenPriceInEth: tokenPriceInEth,
            tokenCalculate: finalPrice,
            minimumReceived: minimumReceived,
          };
          return res.status(200).json(result);
        } catch (error) {
          console.log(error.message);
          let response = {
            message: error,
          };
          res.status(404).send(response);
        }
      } else {
        try {
          const chainId = ChainId.MAINNET;
          const weth = WETH[chainId];
          let toSwapToken = await Fetcher.fetchTokenData(
            chainId,
            contractAddress,
            provider
          );
          // let toSwapToken = await ((toSymbol == "BUSD" && fromSymbol  == "LGBT") || (fromSymbol == "BUSD" &&   toSymbol== "LGBT") ) ?  weth : toTokens;
          const fromSwapToken = await Fetcher.fetchTokenData(
            chainId,
            fromcontractAddress,
            provider
          );
          var amountEth = ethers.utils.parseEther(String(etherAmount));
          //fetch ether through chain id

          const pair = await Fetcher.fetchPairData(
            toSwapToken,
            fromSwapToken,
            provider
          );
          const route = new Route([pair], toSwapToken);
          const trade = new Trade(
            route,
            new TokenAmount(toSwapToken, String(amountEth)),
            TradeType.EXACT_INPUT
          );
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          const tokenPrice = route.midPrice.toSignificant(6);
          let finalPrice = Number(etherAmount) * Number(tokenPrice);
          let executionPrice = trade.executionPrice.toSignificant(6);
          finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

          console.log("1 token = ", tokenPriceInEth);
          console.log("total token by given by eth= ", finalPrice);
          console.log("Minimum received= ", executionPrice * etherAmount);
          const minimumReceived = executionPrice * etherAmount;
          const result = {
            tokenPriceInEth: tokenPriceInEth,
            tokenCalculate: finalPrice,
            minimumReceived: minimumReceived,
          };
          return res.status(200).json(result);
        } catch (error) {
          console.log(error);
          let response = {
            message: error,
          };
          res.status(404).send(response);
        }
      }
    } else {
      let response = {
        message: "Contract address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToTokenSwap", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.toSymbol &&
    req.body.symbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType &&
    req.body.percentage
  ) {
    let privateKey = req.body.privateKey;
    let toSymbol = req.body.toSymbol;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;
    let fromSymbol = req.body.symbol;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    let fromContractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    if (contractAddress && fromContractAddress) {
      if (
        (toSymbol === "BUSD" && fromSymbol === "LGBT") ||
        (fromSymbol === "BUSD" && toSymbol === "LGBT")
      ) {
        try {
          var tradeAmount = ethers.utils.parseEther(String(etherAmount));
          const chainId = ChainId.MAINNET;
          console.log("chainId ", chainId);
          const weth = WETH[chainId];

          console.log("weth ", weth);

          const addresses = {
            WBNB: fromContractAddress,
            BUSD: contractAddress,
            PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
          };
          const [WBNB, BUSD] = await Promise.all(
            [addresses.WBNB, addresses.BUSD].map(
              (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
            )
          ).catch((err) => {
            if (err) {
              console.log("Error Occur in Token to Token Swap");
              console.trace(err);
            }
          });
          console.log("WBNB, BUSD ----", WBNB, BUSD);
          const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

          console.log("pair ----", pair);
          const route = await new Route([pair], WBNB);

          console.log("route  ---", route);
          const trade = await new Trade(
            route,
            new TokenAmount(WBNB, tradeAmount),
            TradeType.EXACT_INPUT
          );
          console.log("trade ----", trade);
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          const tokenPrice = route.midPrice.toSignificant(6);
          // set Tolerance 0.5%
          const slippageTolerance = new Percent(
            req.body.percentage ? req.body.percentage : "50",
            "10000"
          ); //10 bips 1 bip = 0.001%
          const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
          //set path of token and ether
          console.log("WBNB.address ", WBNB.address);
          console.log("WBNB.address ", WBNB.address);
          const path = [WBNB.address, BUSD.address];
          const to = walletAddress;
          const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
          const value = trade.inputAmount.raw;

          const singer = new ethers.Wallet(privateKey);

          const account = singer.connect(provider);
          const PANCAKE_ROUTER = new ethers.Contract(
            pancakeSwapRouter2Address,
            abi,
            account
          );
          try {
            const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
              String(amountOutMin),
              path,
              to,
              deadline,
              { value: String(value), gasPrice: 5.5e10 }
            );

            const receipt = await tx.wait();
            console.log(`Tx-hash: ${tx.hash}`);
            console.log(`Tx was mined in block: ${receipt.blockNumber}`);

            let response = {
              hash: tx.hash,
              blockNumber: receipt.blockNumber,
            };
            return res.status(200).json(response);
          } catch (error) {
            return res.status(400).json({ error: error.reason });
          }
        } catch (e) {
          console.log(e);
          res.status(400).send({ message: e.message });
        }
      } else {
        try {
          const chainId = ChainId.MAINNET;
          const weth = WETH[chainId];
          let toSwapToken = await Fetcher.fetchTokenData(
            chainId,
            contractAddress,
            provider
          );
          // let toSwapToken = await ((toSymbol == "BUSD" && fromSymbol  == "LGBT") || (fromSymbol == "BUSD" &&   toSymbol== "LGBT") ) ?  weth : toTokens;
          const fromSwapToken = await Fetcher.fetchTokenData(
            chainId,
            fromcontractAddress,
            provider
          );
          var amountEth = ethers.utils.parseEther(String(etherAmount));
          //fetch ether through chain id

          const pair = await Fetcher.fetchPairData(
            toSwapToken,
            fromSwapToken,
            provider
          );
          const route = new Route([pair], toSwapToken);
          const trade = new Trade(
            route,
            new TokenAmount(toSwapToken, String(amountEth)),
            TradeType.EXACT_INPUT
          );
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          const tokenPrice = route.midPrice.toSignificant(6);
          let finalPrice = Number(etherAmount) * Number(tokenPrice);
          let executionPrice = trade.executionPrice.toSignificant(6);
          finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

          console.log("1 token = ", tokenPriceInEth);
          console.log("total token by given by eth= ", finalPrice);
          console.log("Minimum received= ", executionPrice * etherAmount);
          const minimumReceived = executionPrice * etherAmount;
          const result = {
            tokenPriceInEth: tokenPriceInEth,
            tokenCalculate: finalPrice,
            minimumReceived: minimumReceived,
          };
          return res.status(200).json(result);
        } catch (error) {
          console.log(error);
          let response = {
            message: error,
          };
          res.status(404).send(response);
        }
      }
    } else {
      let response = {
        message: "Contract Address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToCoinPrice", async (req, res) => {
  if (req.body.amount && req.body.fromSymbol && req.body.providerType) {
    let etherAmount = parseFloat(req.body.amount);
    let fromSymbol = req.body.fromSymbol;
    let contractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    console.log("contractAddress", contractAddress);
    if (contractAddress) {
      try {
        var tradeAmount = ethers.utils.parseEther(String(etherAmount));
        const chainId = ChainId.MAINNET;
        //console.log(chainId);
        const weth = WETH[chainId];
        //console.log(weth);
        const addresses = {
          WBNB: contractAddress,
          BUSD: weth.address,
          PANCAKE_ROUTER: pancakeSwapRouter2Address, //router 2 address
        };
        const [WBNB, BUSD] = await Promise.all(
          [addresses.WBNB, addresses.BUSD].map(
            (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
          )
        );

        const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
        console.log("pppppppppppppppppppppppppppppppp");
        const route = await new Route([pair], WBNB);
        console.log("==========================");
        const trade = await new Trade(
          route,
          new TokenAmount(WBNB, tradeAmount),
          TradeType.EXACT_INPUT
        );
        console.log("contractAddress==========================");
        const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
        const tokenPrice = route.midPrice.toSignificant(6);
        let finalPrice = Number(etherAmount) * Number(tokenPrice);
        let executionPrice = trade.executionPrice.toSignificant(6);

        finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

        console.log("1 token = ", tokenPriceInEth);
        console.log("total token by given by eth= ", finalPrice);
        console.log("Minimum received= ", executionPrice * etherAmount);

        const minimumReceived = executionPrice * etherAmount;
        const result = {
          tokenPriceInEth: tokenPriceInEth,
          tokenCalculate: finalPrice,
          minimumReceived: minimumReceived,
        };
        return res.status(200).json(result);
      } catch (error) {
        console.log(error.message);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    } else {
      let response = {
        message: "Contract address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToCoinSwap", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.fromSymbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType
  ) {
    let privateKey = req.body.privateKey;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;
    let fromSymbol = req.body.fromSymbol;

    let contractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    if (contractAddress) {
      var tradeAmount = ethers.utils.parseEther(String(etherAmount));
      const chainId = ChainId.MAINNET;
      const weth = WETH[chainId];

      const addresses = {
        WBNB: contractAddress,
        BUSD: weth.address,
        PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
      };
      const [WBNB, BUSD] = await Promise.all(
        [addresses.WBNB, addresses.BUSD].map(
          (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
        )
      );
      const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

      const route = await new Route([pair], WBNB);
      const trade = await new Trade(
        route,
        new TokenAmount(WBNB, tradeAmount),
        TradeType.EXACT_INPUT
      );

      const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
      const tokenPrice = route.midPrice.toSignificant(6);
      // set Tolerance 0.5%
      const slippageTolerance = new Percent("50", "10000"); //10 bips 1 bip = 0.001%
      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
      //set path of token and ether
      console.log("WBNB.address ", WBNB.address);
      const path = [WBNB.address, BUSD.address];
      const to = walletAddress;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw;

      const singer = new ethers.Wallet(privateKey);

      const account = singer.connect(provider);
      const PANCAKE_ROUTER = new ethers.Contract(
        pancakeSwapRouter2Address,
        abi,
        account
      );
      try {
        const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
          String(amountOutMin),
          path,
          to,
          deadline,
          { value: String(value), gasPrice: 5.5e10 }
        );

        const receipt = await tx.wait();
        console.log(`Tx-hash: ${tx.hash}`);
        console.log(`Tx was mined in block: ${receipt.blockNumber}`);

        let response = {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
        return res.status(200).json(response);
      } catch (error) {
        return res.status(400).json({ error: error.reason });
      }
    } else {
      let response = {
        message: "Contract Address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

//combine api for swapping token_to_coin and coin_to_token
router.post("/Swapping", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.symbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType &&
    req.body.swapType
  ) {
    let privateKey = req.body.privateKey;
    let toSymbol = req.body.symbol;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;
    let swapType = req.body.swapType;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    if (contractAddress) {
      var tradeAmount = ethers.utils.parseEther(String(etherAmount));
      const chainId = ChainId.MAINNET;
      const weth = WETH[chainId];

      const addresses = {
        WBNB: swapType == "coin_to_token" ? weth.address : contractAddress, //weth.address,
        BUSD: swapType == "coin_to_token" ? contractAddress : weth.address, //contractAddress,
        PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
      };
      const [WBNB, BUSD] = await Promise.all(
        [addresses.WBNB, addresses.BUSD].map(
          (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
        )
      );
      const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

      const route = await new Route([pair], WBNB);
      const trade = await new Trade(
        route,
        new TokenAmount(WBNB, tradeAmount),
        TradeType.EXACT_INPUT
      );

      const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
      const tokenPrice = route.midPrice.toSignificant(6);
      // set Tolerance 0.5%
      const slippageTolerance = new Percent("50", "10000"); //10 bips 1 bip = 0.001%
      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
      //set path of token and ether
      const path = [addresses.WBNB, addresses.BUSD];
      const to = walletAddress;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw;

      const singer = new ethers.Wallet(privateKey);

      const account = singer.connect(provider);
      const PANCAKE_ROUTER = new ethers.Contract(
        pancakeSwapRouter2Address,
        abi,
        account
      );
      try {
        const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
          String(amountOutMin),
          path,
          to,
          deadline,
          { value: String(value), gasPrice: 5.5e10 }
        );

        const receipt = await tx.wait();
        console.log(`Tx-hash: ${tx.hash}`);
        console.log(`Tx was mined in block: ${receipt.blockNumber}`);

        let response = {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
        return res.status(200).json(response);
      } catch (error) {
        return res.status(400).json({ error: error.reason });
      }
    } else {
      let response = {
        message: "Contract Address not exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

//BTC trasections
// test network  https://api.blockcypher.com/v1/bcy/test/
// live network  https://api.blockcypher.com/v1/btc/main/
router.post("/estimateBTCTransactionFee", async (req, res) => {
  if (req.body.fromAddress && req.body.toAddress && req.body.amount) {
    let status = await helper.validateBitcoinAddress(req.body.toAddress);
    let responce = await helper.getBalance(req.body.toAddress);
    if (status == 200 && responce.btcBal > Number(req.body.amount)) {
      let data = await helper.estimateFeeForBTCTransaction(
        req.body.fromAddress,
        req.body.toAddress,
        req.body.amount
      );
      res.status(data.status).send(data);
    } else {
      let response = {
        message:
          "wallet address is not valid or You do not have enough amount for trasection",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

router.post("/sendBtcTrasection", async (req, res) => {
  if (
    req.body.fromAddress &&
    req.body.toAddress &&
    req.body.amount &&
    req.body.privateKey
  ) {
    let fromAddress = req.body.fromAddress;
    let toAddress = req.body.toAddress;
    let amount = parseFloat(req.body.amount);
    let privatekey = req.body.privateKey;

    let data = await helper.sendBTCTrasection(
      privatekey,
      amount,
      fromAddress,
      toAddress
    );
    res.status(data.status).send(data);
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

router.post("/BTCBalance", async (req, res) => {
  if (req.body.walletAddress && req.body.symbol) {
    let walletAddress = req.body.walletAddress;
    let symbol = req.body.symbol;
    let responce = await helper.getBalance(walletAddress);
    const btcInDollar = await helper.getCryptoInUsd(symbol);
    if (responce.btcBal > 0 && btcInDollar > 0) {
      let balanceInDollar = responce.btcBal * btcInDollar;
      responce.balanceInDollar = balanceInDollar;
    }
    res.status(responce.status).send(responce);
  } else {
    let response = {
      message: "Payload Missing",
    };
    res.status(404).send(response);
  }
});

router.post("/getEtherTrasections", async (req, res) => {
  if (req.body.walletAddress && req.body.filter && req.body.type) {
    // txlist mean coins trasections and tokentx mean token trasections
    let type = (req.body.type = "coin") ? "txlist" : "tokentx";
    let walletAddress = req.body.walletAddress;
    let filter = req.body.filter;
    var data = JSON.stringify({
      inputs: [
        {
          addresses: ["bc1q5dl6esz96hvhal69eex7edmyqkmm9le9uvy07w"],
        },
      ],
      outputs: [
        {
          addresses: ["bc1q2vuncvvacqgfepnwwjlpalycgrs7atfqaqdf8w"],
          value: 30000000,
        },
      ],
    });
    var config = {
      method: "get",
      url: `https://api.etherscan.io/api?module=account&action=${type}&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=F6QQM17ZHNAT2SX9WJCCUNIX4RNBPVPPME`,
      //url: `https://api.etherscan.io/api?module=account&action=${type}&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=F6QQM17ZHNAT2SX9WJCCUNIX4RNBPVPPME`,
      //url : `https://api.etherscan.io/api?module=account&action=tokentx&address=0x4e83362442b8d1bec281594cea3050c8eb01311c&startblock=0&endblock=27025780&sort=asc&apikey=YourApiKeyToken`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios(config)
      .then(async (response) => {
        let trasectionData = JSON.parse(JSON.stringify(response.data));
        console.log(trasectionData);

        if (trasectionData) {
          let trasections = trasectionData.result;
          for (let iteration = 0; iteration < trasections.length; iteration++) {
            trasections[iteration]["gasPrice"] = convert(
              trasections[iteration]["gasPrice"],
              "gwei",
              "ether"
            );
          }
          if (filter == "send") {
            let sendTrasectionsHistory = trasections.filter(
              (item) => item.from === walletAddress
            );
            res.status(200).send({ data: sendTrasectionsHistory });
          } else if (filter == "receive") {
            let receiveTrasectionsHistory = trasections.filter(
              (item) => item.to === walletAddress
            );
            res.status(200).send({ data: receiveTrasectionsHistory });
          } else {
            res.status(200).send({ data: trasections });
          }
        } else {
          res.status(404).send({ message: "No history found" });
        }
      })
      .catch(function (error) {
        console.log(error);
        res.status(404).send({ message: error.message });
      });
  } else {
    res.status(404).send({ message: "Payload Missing!!!" });
  }
});

router.post("/getBSCTrasections", async (req, res) => {
  if (req.body.walletAddress && req.body.filter && req.body.type) {
    let walletAddress = req.body.walletAddress.toLowerCase();
    // txlist mean coins trasections and tokentx mean token trasections
    let type = (req.body.type = "coin") ? "txlist" : "tokentx";
    let filter = req.body.filter;
    var config = {
      method: "get",
      url: `https://api-testnet.bscscan.com/api?module=account&action=${type}&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=XBYQVS8AFZTKC2B187XTNP7UQN3KDH5APD`,
      headers: {},
    };
    axios(config)
      .then(function (response) {
        let trasectionData = JSON.parse(JSON.stringify(response.data));

        if (trasectionData) {
          let trasections = trasectionData.result;
          for (let iteration = 0; iteration < trasections.length; iteration++) {
            trasections[iteration]["gasPrice"] = convert(
              trasections[iteration]["gasPrice"],
              "gwei",
              "ether"
            );
          }
          if (filter == "send") {
            let sendTrasectionsHistory = trasections.filter(
              (item) => item.from === walletAddress
            );
            res.status(200).send({ data: sendTrasectionsHistory });
          } else if (filter == "receive") {
            let receiveTrasectionsHistory = trasections.filter(
              (item) => item.to === walletAddress
            );
            console.log(receiveTrasectionsHistory);
            res.status(200).send({ data: receiveTrasectionsHistory });
          } else {
            res.status(200).send({ data: trasections });
          }
        } else {
          res.status(404).send({ message: "No history found" });
        }
      })
      .catch(function (error) {
        res.status(404).send({ message: error.message });
      });
  } else {
    res.status(404).send({ message: "Payload Missing!!!" });
  }
});

module.exports = router;
