const express = require("express");
const { User, Account } = require("../db/data");
const { authMiddleware } = require("../middleware/middleware");
const { default: mongoose } = require("mongoose");
const accountRouter = express.Router();
accountRouter.use(express.json());

accountRouter.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    if (!account) {
        return res.status(404).json({ msg: "Account not found" });
    }

    res.status(200).json({
        balance: account.balance
    });

});

accountRouter.post("/transfer", authMiddleware, async (req, res) => {

    const session = await mongoose.startSession();

    session.startTransaction();
    const {amount,to} = req.body;

    const account = await Account.findOne({ userId: req.userId }).session(session);

    if (!account || account.balance < amount){
        await session.abortTransaction();
        res.json({
            mgs: "Insufficient balance"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if(!toAccount){
        await session.abortTransaction();
        res.json({
            msg: "Invalid account"
        });
    }

    await Account.updateOne({userId:req.userId}, {$inc: {balance: -amount}}).session(session);
    await Account.updateOne({userId:to}, {$inc: {balance: amount}}).session(session);


    await session.commitTransaction();
    res.json({
        msg: "Transfer successfully"
    });

})

module.exports = accountRouter;