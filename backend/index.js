const express = require("express");
const mainRouter = require("./routes/index");
const app = express();
const PORT = 3000;
const cors = require("cors");

app.use(cors());
app.use("/api/v1", mainRouter);
app.use(express.json());


app.listen(PORT);