const express = require("express");
const { z } = require("zod");
const { User, Account } = require("../db/data");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware/middleware");

const userRouter = express.Router();
userRouter.use(express.json());


const signupBody = z.object({
    username: z.string().email(),
    password: z.string(),
    firstName: z.string(),
    lastName: z.string()
});

const signinBody = z.object({
    username: z.string().email(),
    password: z.string()
});

const updateBody = z.object({
    firstName: z.string().optional(),
    password: z.string().optional(),
    lastName: z.string().optional()
})

userRouter.post("/signup", async (req, res) => {
    try {
        const { success } = signupBody.safeParse(req.body)
        if (!success) {
            res.status(411).json({
                msg: "Incorrect Inputs"
            });
        }

        const existingUser = await User.findOne({
            username: req.body.username
        });

        if (existingUser) {
            return res.status(411).json({
                msg: "User already exists"
            });
        }

        const user = await User.create({
            username: req.body.username,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        });


        const userId = user._id;

        await Account.create({
            userId,
            balance: 1 + Math.random() * 10000
        });

        const token = jwt.sign({userId}, JWT_SECRET);


        res.json({
            msg: "User created",
            id: token
        });

        

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                msg: "Invalid input", error
            });
        } else {
            console.error(error);
            res.status(500).json({
                msg: "internal server error"
            })
        }
    }

})

userRouter.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body);
    if (!success) {
        res.status(411).json({
            msg: "Invalid credentials"
        })
    }

    const user = User.findOne({
        username: req.body.username,
        password: req.body.password
    });

    if (user) {
        const userId = user._id;
        const token = jwt.sign({userId}, JWT_SECRET);

        res.status(200).json({
            token: token
        });
        return;
    }

    res.status(411).json({
        msg: "error while logging in"
    });


});

userRouter.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body);
    if (!success) {
        res.status(411).json({
            msg: "invalid input"
        });
    }
    await User.updateOne(req.body, {
        _id: req.userId
    });

    res.json({
        msg: "Updated successfully"
    });

});

userRouter.get("/bulk", async (req, res) => {
    const filter = req.params.filter || "";

    const user = await User.find({
        "$or": [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    });

    if (!user) {
        return res.json({
            msg: "User not found"
        });
    }

    res.json({
        user: user.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
});


module.exports = userRouter;
