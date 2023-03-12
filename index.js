// const multer  = require('multer')
import subProcess from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import { Configuration, OpenAIApi } from "openai";

const app = express();

dotenv.config(".env");

const port = 3000;

app.use(cors());

const OPENAI_MODELS = {
  text_davinci_2: "text-davinci-002",
  text_davinci_3: "text-davinci-003",
  code_davinci_2: "code-davinci-002",
  code_davinci_3: "code-davinci-003",
  gpt_3_5: "gpt-3.5-turbo",
};

/* OpenAI config */
const configuration = new Configuration({
  organization: "org-EaTqpxgG5XqmmSuZTqsV9RC9",
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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

app.post("/generateExplanation", async (req, res) => {
  const fileName = req.query["contractName"];
  let data;
  try {
    data = fs.readFileSync(`./contracts/${fileName}.sol`, "utf8");
  } catch (err) {
    console.error(err);
  }
  const result = await contract_explanation(data, "");

  fs.writeFileSync(`./generation/explanation/${fileName}.txt`, result, (err) => {
    if (err) {
      console.error(err);
    }
  });

  res.status(200).send(result);
});

app.get("/generateRequireTesting", async (req, res) => {
  const fileName = req.query["contractName"];
  let data;
  try {
    data = fs.readFileSync(`./contracts/${fileName}.sol`, "utf8");
  } catch (err) {
    console.error(err);
  }
  const result = await require_testing(data, "");

  fs.writeFileSync(`./generation/require_testing/${fileName}.txt`, result, (err) => {
    if (err) {
      console.error(err);
    }
  });

  res.status(200).send(result);
});

app.get("/generateOwnershipTesting", async (req, res) => {
  const fileName = req.query["contractName"];
  let data;
  try {
    data = fs.readFileSync(`./contracts/${fileName}.sol`, "utf8");
  } catch (err) {
    console.error(err);
  }
  const result = await ownership_testing(data);

  fs.writeFileSync(`./generation/ownership_testing/${fileName}.txt`, result, (err) => {
    if (err) {
      console.error(err);
    }
  });

  res.status(200).send(result);
});

app.get("/testFiles", async (req, res) => {
  // download tests
});

app.get("/test", async (req, res) => {
  const contractName = req.query["contractName"];

  subProcess.exec(`npx hardhat test --testfiles "./test/greeter/${contractName}.js"`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);

      fs.writeFileSync(`./testing/err/${fileName.slice(0, fileName.length - 4)}.txt`, stderr.toString(), (err) => {
        if (err) {
          console.error(err);
        }
      });
    } else {
      console.log(`The stdout Buffer from shell: ${stdout.toString()}`);

      fs.writeFileSync(`/testing/${fileName.slice(0, fileName.length - 3)}.txt`, stdout.toString(), (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  });
  res.status(200).send();
});

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});

const contract_explanation = async (smart_contract_to_test) => {
  const unit_test_package = "mocha and chai";

  let prompt_to_explain_the_function = `
    # How to write great unit tests with ${unit_test_package} Java Script testing frameworks for Ethereum smart contracts writen in Solidity.

    In this advanced tutorial for experts, we'll use Solidity version 0.8.0 and ${unit_test_package} Java Script testing frameworks to write a suite of unit tests to verify the behavior of the following smart contract.
    ${smart_contract_to_test}

    Before writing any unit tests, let's review what each element of the smart contract is doing exactly and what the author's intentions may have been.
    - First,

    ###`;

  // send the prompt to the API, using \n\n as a stop sequence to stop at the end of the bullet list.
  const response = await openai.createChatCompletion({
    model: OPENAI_MODELS.gpt_3_5,
    messages: [{ role: "user", content: prompt_to_explain_the_function }],
    n: 1,
    temperature: 0.5,
    presence_penalty: 0,
    frequency_penalty: 0,
    stop: "###",
  });

  const result = response.data.choices[0].message?.content;
  console.log("[explanation_completion]:", result);

  return result;
};

const require_testing = async (smart_contract_to_test) => {
  let promt_to_make_tests_for_reverts = `
  Generate unit tests using mocha and chai for hardhat for the following contract functions that will revert for the following contract:
  ${smart_contract_to_test}
  `;

  const plan_response = await openai.createChatCompletion({
    model: OPENAI_MODELS.gpt_3_5,
    messages: [{ role: "user", content: promt_to_make_tests_for_reverts }],
    n: 1,
    temperature: 0.5,
    presence_penalty: 0,
    frequency_penalty: 0,
  });

  const result = plan_response.data.choices[0].message?.content;
  console.log("REQUIRE TESTING: ", result);
  return result;
};

const ownership_testing = async (smart_contract_to_test) => {
  let promt_generate_access_tests = `
  Write unit tests using mocha and chai for hardhat to test if the functions reverts if the caller is not the owner of the following contract:
  ${smart_contract_to_test}
  `;

  const full_unit_test_response = await openai.createChatCompletion({
    model: OPENAI_MODELS.gpt_3_5,
    messages: [{ role: "user", content: promt_generate_access_tests }],
    n: 1,
    temperature: 0.5,
    presence_penalty: 0,
    frequency_penalty: 0,
  });

  const result = full_unit_test_response.data.choices[0].message?.content;
  console.log("ownership testing:", result);
  return result;
};

// async function unit_test_from_smart_contract(smart_contract_to_test, unit_test_package = "mocha, chai") {
//   // Outputs a unit test for a given Solidity function, using a 3-step GPT-3 prompt.

//   // Step 1: Generate an explanation of the function.
//   // let prompt_to_explain_the_function = `
//   //   # How to write great unit tests with ${unit_test_package} Java Script testing frameworks for Ethereum smart contracts writen in Solidity.

//   //   In this advanced tutorial for experts, we'll use Solidity version 0.8.0 and ${unit_test_package} Java Script testing frameworks to write a suite of unit tests to verify the behavior of the following smart contract.
//   //   ${smart_contract_to_test}

//   //   Before writing any unit tests, let's review what each element of the smart contract is doing exactly and what the author's intentions may have been.
//   //   - First,

//   //   ###`;

//   // // send the prompt to the API, using \n\n as a stop sequence to stop at the end of the bullet list.
//   // const response = await openai.createChatCompletion({
//   //   model: OPENAI_MODELS.gpt_3_5,
//   //   messages: [{ role: "user", content: prompt_to_explain_the_function }],
//   //   n: 1,
//   //   temperature: 0.5,
//   //   presence_penalty: 0,
//   //   frequency_penalty: 0,
//   //   stop: "###",
//   // });
//   // const explanation_completion = response.data.choices[0].message?.content;
//   // console.log('[explanation_completion]:', explanation_completion);

//   let prompt_to_explain_a_plan = `

//     A good unit test suite for an Ethereum Smart contract should aim to:
//   - Test the visibility properties for state variables (public, internal or private)
//   - Test the visibility properties for functions (external, public, internal and private)
//   - Try to assert all "require" statement encountered in the smart contract's functions
//   - Test the smart contract's functions behavior for a wide range of possible inputs
//   - Test edge cases that the author may not have foreseen
//   - Take advantage of the features of ${unit_test_package} Java Script testing sting frameworks to make the tests easy to write and maintain
//   - Be easy to read and understand, with clean code and descriptive names
//   - Be deterministic, so that the tests always pass or fail in the same way

//   ${unit_test_package} Java Script testing frameworks has many convenient features that make it easy to write and maintain unit tests. We'll use them to write unit tests for each function inside the smart contract above.

//   For every function inside this particular smart contract, we'll want our unit tests to handle the following diverse scenarios (and under each scenario, we include a few examples as sub-bullets):
//   -`;

//   let promt_to_make_tests_for_reverts = `
//   Generate unit tests using mocha and chai for hardhat for the following contract functions that will revert for the following contract:
//   ${smart_contract_to_test}
//   `;

//   // let prior_text = prompt_to_explain_the_function + explanation_completion;
//   // let full_plan_prompt = prior_text + prompt_to_explain_a_plan;

//   // const plan_response = await openai.createChatCompletion({
//   //   model: OPENAI_MODELS.gpt_3_5,
//   //   messages: [{ role: "user", content: promt_to_make_tests_for_reverts }],
//   //   n: 1,
//   //   temperature: 0.5,
//   //   presence_penalty: 0,
//   //   frequency_penalty: 0,
//   // });

//   // const revert_tests = plan_response.data.choices[0].message?.content;
//   // console.log("REVERTS TESTS \n");
//   // console.log(revert_tests);
//   // console.log("END OF REVERTS TESTS \n");
//   // console.log('[plan_completion]:', plan_completion);

//   // TODO: Step 2b: If the plan is short, ask GPT-3 to elaborate further.

//   // Create a markdown-formatted prompt that asks GPT-3 to complete a unit test
//   let prompt_to_generate_the_unit_test = `

//   We use ethers JS library to load an instance of the smart contract.

//   We import the "chai" JS testing framework like this: import { expect } from "chai";

//   We import the "ether" JS testing framework from "hardhat" like this: import { ethers } from "hardhat";

//   We import the type of the smart contract instance from "typechain".

//   All contract field members should be accessed same as a callable function, using parantheses at the end.

//   We want to have all tests written in one big file.

//   # Javascript
// +++
//   `;

//   let promt_generate_access_tests = `
//   Write unit tests using mocha and chai for hardhat to test if the functions reverts if the caller is not the owner of the following contract:
//   ${smart_contract_to_test}
//   `;
//   // let full_unit_test_prompt = full_plan_prompt + plan_completion + prompt_to_generate_the_unit_test;
//   // console.log('[full_unit_test_prompt]:', full_unit_test_prompt);
//   const full_unit_test_response = await openai.createChatCompletion({
//     model: OPENAI_MODELS.gpt_3_5,
//     messages: [{ role: "user", content: promt_generate_access_tests }],
//     n: 1,
//     temperature: 0.5,
//     presence_penalty: 0,
//     frequency_penalty: 0,
//   });

//   // const full_unit_test_completion = full_unit_test_response.data.choices[0].message?.content;
//   const generate_access_tests = full_unit_test_response.data.choices[0].message?.content;
//   console.log("[full_unit_test_comletion]:", "\n" + generate_access_tests);
//   return generate_access_tests;
// }
