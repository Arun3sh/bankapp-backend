import express, { request, response } from "express";
import {
  findUserWithId,
  findUser,
  findUserAcc,
  addUsers,
  depositMoney,
  withdrawMoney,
} from "./helper.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// Get user balance
router.get("/Balance", async (request, response) => {
  const { acc } = request.body;

  const getData = await findUserAcc({ acc: +acc });

  response.send(`${getData.balance}`);
});

router.put("/Deposit", async (request, response) => {
  const { acc, amt } = request.body;

  const ts = Date.now();
  const d = new Date(ts);
  const date = d.toDateString();

  if (amt < 500) {
    response.status(401).send("Minimum deposit amount is 500");
    return;
  }

  if (amt > 50000) {
    response.status(401).send("Maximum deposit amount is 50000");
    return;
  }

  const getData = await findUserAcc({ acc: +acc });

  // First time deposit after account creation
  if (getData.transaction.length == 0) {
    const deposit = await depositMoney(getData._id, amt, date, 0, 0);
    response.send(deposit);
    return;
  }

  // To confirm if this is the first transaction for the day
  if (getData.transaction[getData.transaction.length - 1].date !== date) {
    const deposit = await depositMoney(id, amt, date, 1, 0);
    response.send(deposit);
    return;
  }
  // If user has made a transaction in the same day
  if (getData.transaction[getData.transaction.length - 1].depositCount < 3) {
    const deposit = await depositMoney(
      getData._id,
      amt,
      date,
      getData.transaction[getData.transaction.length - 1].depositCount + 1,
      getData.transaction[getData.transaction.length - 1].withdrawCount
    );
    response.send(deposit);
    return;
  }
  response.status(401).send("Only 3 deposits are allowed in a day");
});

router.put("/Withdraw", async (request, response) => {
  const { acc, amt } = request.body;

  const ts = Date.now();
  const d = new Date(ts);
  const date = d.toDateString();

  if (amt < 1000) {
    response.status(401).send("Minimum withdrawal amount is 1000");
    return;
  }

  if (amt > 25000) {
    response.status(401).send("Maximum withdrawal amount is 25000");
    return;
  }
  const getData = await findUserAcc({ acc: +acc });

  // First time withdraw after account creation
  if (getData.transaction.length == 0) {
    const withdraw = await withdrawMoney(getData._id, amt, date, 0, 0);
    response.send(withdraw);
    return;
  }

  // To confirm if this is the first transaction for the day
  if (getData.transaction[getData.transaction.length - 1].date !== date) {
    const withdraw = await withdrawMoney(id, amt, date, 1, 0);
    response.send(withdraw);
    return;
  }
  // If user has made a transaction in the same day
  if (getData.transaction[getData.transaction.length - 1].withdrawCount < 3) {
    const withdraw = await withdrawMoney(
      getData._id,
      amt,
      date,
      getData.transaction[getData.transaction.length - 1].depositCount,
      getData.transaction[getData.transaction.length - 1].withdrawCount + 1
    );
    response.send(withdraw);
    return;
  }
  response.status(401).send("Only 3 withdrawals are allowed in a day");
});

router.put("/Transfer", async (request, response) => {
  const { from, to, amt } = request.body;

  const ts = Date.now();
  const d = new Date(ts);
  const date = d.toDateString();

  if (amt < 1000) {
    response.status(401).send(`Minimum withdrawal amount is 1000 for ${from}`);
    return;
  }

  if (amt > 25000) {
    response.status(401).send(`Maximum withdrawal amount is 25000 ${from}`);
    return;
  }

  const getDataFrom = await findUserAcc({ acc: +from });
  const getDataTo = await findUserAcc({ acc: +to });

  if (
    getDataFrom.transaction[getDataFrom.transaction.length - 1].withdrawCount <
      3 &&
    getDataTo.transaction[getDataTo.transaction.length - 1].depositCount < 3
  ) {
    const withdraw = await withdrawMoney(
      getDataFrom._id,
      amt,
      date,
      getDataFrom.transaction[getDataFrom.transaction.length - 1].depositCount,
      getDataFrom.transaction[getDataFrom.transaction.length - 1]
        .withdrawCount + 1
    );
    const deposit = await depositMoney(
      getDataTo._id,
      amt,
      date,
      getDataTo.transaction[getDataTo.transaction.length - 1].depositCount + 1,
      getDataTo.transaction[getDataTo.transaction.length - 1].withdrawCount
    );

    response.send("Successful");
    return;
  }
  response.status(401).send("Exceeded Transaction limit ");
});

// Post method to create-account of new user
router.post("/Create", async (request, response) => {
  const { username } = request.body;
  // const { username, password, email } = request.body;

  const ts = Date.now();
  const d = new Date(ts);
  const date = d.toDateString();

  const checkEmail = await findUser({ username: username });

  if (checkEmail) {
    response.status(400).send("User exists");
    return;
  }

  const accno = Math.floor(Math.random() * 9000000000) + 1;

  const result = await addUsers({
    username: username,
    acc: accno,
    balance: 0,
    transaction: [{ date: date, withdrawCount: 0, depositCount: 0 }],
  });

  response.send(`${accno}`);
});

export const usersRouter = router;
