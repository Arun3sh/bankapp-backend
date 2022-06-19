import { client } from "./../../index.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

async function findUserWithId(id) {
  return await client
    .db("mern")
    .collection("bankusers")
    .findOne({ _id: ObjectId(id) });
}

async function findUserWithIdTranD(id, date) {
  return await client
    .db("mern")
    .collection("bankusers")
    .findOne({
      _id: ObjectId(id),
      transaction: { $elemMatch: { date: date } },
    });
}

async function findUserWithIdTranW(id, date) {
  return await client
    .db("mern")
    .collection("bankusers")
    .findOne(
      { _id: ObjectId(id), transaction: { $elemMatch: { date: date } } },
      { $inc: { "transaction.$[outer].withdrawCount": 1 } },
      { arrayFilters: [{ "outer.date": date }] }
    );
}

async function findUser(filter) {
  return await client.db("mern").collection("bankusers").findOne(filter);
}

async function findUserAcc({ acc }) {
  return await client.db("mern").collection("bankusers").findOne({ acc: acc });
}

async function addUsers(data) {
  return await client.db("mern").collection("bankusers").insertOne(data);
}

async function genPassword(password) {
  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
}

async function depositMoney(id, amt, date, dc, wc) {
  return await client
    .db("mern")
    .collection("bankusers")
    .updateOne(
      { _id: ObjectId(id), transaction: { $elemMatch: { date: date } } },
      {
        $set: {
          "transaction.$[outer].depositCount": dc,
          "transaction.$[outer].withdrawCount": wc,
        },
        $inc: {
          balance: amt,
        },
      },
      { arrayFilters: [{ "outer.date": date }] }
    );
}

async function withdrawMoney(id, amt, date, dc, wc) {
  return await client
    .db("mern")
    .collection("bankusers")
    .updateOne(
      { _id: ObjectId(id), transaction: { $elemMatch: { date: date } } },
      {
        $set: {
          "transaction.$[outer].depositCount": dc,
          "transaction.$[outer].withdrawCount": wc,
        },
        $inc: {
          balance: -amt,
        },
      },
      { arrayFilters: [{ "outer.date": date }] }
    );
}

export {
  findUserWithId,
  findUserWithIdTranD,
  findUserWithIdTranW,
  findUser,
  findUserAcc,
  addUsers,
  genPassword,
  depositMoney,
  withdrawMoney,
};
