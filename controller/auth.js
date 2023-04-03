var express = require("express");
const md5 = require("md5");
var router = express.Router();
const helper = require("../helper/customHelper");
const bip39 = require("bip39");

router.post("/sigin", async (req, res) => {
  if (req.body.email && req.body.password) {
    let userObject = await helper.varifyCredentials(
      req.body.email.trim().toLowerCase(),
      req.body.password
    );
    if (userObject) {
      let response = {
        data: userObject,
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "credential invalid!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/sendOTPNumber", async (req, res) => {
  if (req.body.phone_number) {
    let check = await helper.sendNumberOtp(req.body.phone_number);
    if (check.sid) {
      let response = {
        message: "code sended!!!",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "code not sended try again!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/varifyOTPNumber", async (req, res) => {
  if (req.body.phone_number && req.body.code) {
    let check = await helper.varifyOtp(req.body.phone_number, req.body.code);
    if (check.status == "approved") {
      let response = {
        message: "code varified!!!",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "varification failed try again!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/sendOTPEmail", async (req, res) => {
  if (req.body.email) {
    let check = await helper.generateEmailConfirmationCodeSendIntoEmail(
      req.body.email
    );
    if (check == true) {
      let response = {
        message: "code send in email!!!",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "code not sended try again!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/varifyOTPUsingEmail", async (req, res) => {
  if (req.body.email && req.body.code) {
    let check = await helper.codeVarifyEmail(req.body.email, req.body.code);
    console.log("assas", check);
    if (check > 0) {
      let response = {
        message: "code varified!!!",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "varification failed try again!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/createRecoveryPhrase", async (req, res) => {
  if (req.body.walletType) {
    let recoveryPhrase = bip39.generateMnemonic();
    let response = {
      recoveryPhrase,
    };
    res.status(200).send(response);
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/signup", async (req, res) => {
  if (req.body.email && req.body.password && req.body.recoveryPhrase) {
    let userObject = await helper.isUserAlreadyExists(req.body.email);
    if (userObject == false) {
      var walletDeatils = await helper.createTrustWallet(
        req.body.recoveryPhrase
      );
      if (walletDeatils == false) {
        let response = {
          message: "invalid mnemonic!!!",
        };
        res.status(404).send(response);
      } else {
        let insertData = {
          password: md5(req.body.password.trim()),
          email: req.body.email.trim().toLowerCase(),
          recoveryPhrase: walletDeatils.recoveryPhrase,
          walletAddress: walletDeatils.walletAddress,
          privateKey: walletDeatils.privateKey,
          // recoveryPhraseBTC :   walletDeatils.recoveryPhraseBTC,
          walletAddressBTC: walletDeatils.walletAddressBTC,
          privateKeyBTC: walletDeatils.privateKeyBTC,
          created_date: new Date(),
        };

        let userId = await helper.saveUserData(insertData);
        // insertData.userId = userId;
        let response = {
          insertData,
        };
        res.status(200).send(response);
      }
    } else {
      let response = {
        message: "email already exists!!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/resetPassword", async (req, res) => {
  if (req.body.user_id && req.body.oldPassword && req.body.newPassword) {
    let status = await helper.varifyPasswordAndUpdate(
      req.body.user_id,
      req.body.oldPassword,
      req.body.newPassword
    );
    if (status == true) {
      let response = {
        message: "updated successfully!!!",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "not updated old password are not matched!!! ",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/forgetPassword", async (req, res) => {
  if (req.body.email && req.body.password) {
    let status = await helper.updatePassword(req.body.email, req.body.password);
    if (status == true) {
      let response = {
        message: "updated successfully!!!",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "not updated old password are not matched!!! ",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/updateUserEmail", async (req, res) => {
  if (req.body.email && req.body.user_id) {
    console.log(req.body.user_id);
    console.log(req.body.email);
    let response = await helper.updateUserEmail(
      req.body.email,
      req.body.user_id
    );
    res.status(response.status).send(response);
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/tokensSwitch", async (req, res) => {
  if (req.body.userId && req.body.tokenName) {
    helper.updateTheRecord(
      req.body.userId,
      req.body.tokenName,
      req.body.status
    );

    let response = {
      message: `we make the status : ${req.body.status}`,
    };
    res.status(200).send(response);
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

router.post("/getUserToken", async (req, res) => {
  if (req.body.userId) {
    let data = await helper.getRecord(req.body.userId);

    let response = {
      data,
    };
    res.status(200).send(response);
  } else {
    let response = {
      message: "payload missing!!!",
    };
    res.status(404).send(response);
  }
});

module.exports = router;
