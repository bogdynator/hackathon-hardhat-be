// const multer  = require('multer')
import subProcess from "child_process";
import cors from "cors";
import express from "express";
import fs from "fs";
import multer from "multer";

const app = express();

const port = 3000;

app.use(cors());

app.get("/", function (req, res) {
  res.send("GET request to homepage", 200);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "contracts/");
  },
  filename: function (req, file, cb) {
    // cb(null, req.query["address"] + "-" + file.originalname);
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single("contract"), async function (req, res) {
  console.log("Getting file");

  const file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  console.log("Starting shell command");

  // const fileName = req.query["address"] + "-" + file.originalname;
  const fileName = file.originalname;
  subProcess.exec(
    `slither ./contracts/${fileName} --solc-remaps '@openzeppelin=node_modules/@openzeppelin hardhat=node_modules/hardhat'`,
    (err, stdout, stderr) => {
      if (err) {
        console.error(err);

        fs.writeFileSync(`./audits/err/${fileName.slice(0, fileName.length - 4)}.txt`, stderr.toString(), (err) => {
          if (err) {
            console.error(err);
          }
        });
      } else {
        console.log(`The stdout Buffer from shell: ${stdout.toString()}`);

        fs.writeFileSync(`/audits/${fileName.slice(0, fileName.length - 3)}.txt`, stdout.toString(), (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    },
  );

  res.status(200).send("DONE");
});

app.get("/audit", function (req, res) {
  // const address = req.query["address"];
  const contractName = req.query["contractName"];
  // const fileName = address + "-" + contractName + ".txt";
  const fileName = contractName + ".txt";
  let data;
  try {
    data = fs.readFileSync(`./audits/err/${fileName}`, "utf8");
    if (data === undefined || data === "") {
      data = fs.readFileSync(`./audits/${fileName}`, "utf8");
    }
  } catch (err) {
    console.error(err);
  }
  res.status(200).send(data);
});

app.post("/generate", async (req, res) => {
  // send to gpt and wait for result => saved in a file
});

app.get("/testFiles", async (req, res) => {
  // download tests
});

app.get("/test", async (req, res) => {});

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});
