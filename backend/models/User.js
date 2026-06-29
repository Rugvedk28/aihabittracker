import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  getMockStore,
  isMockDb,
  matchesQuery,
} from "../utils/mockDb.js";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    avatar: {
      type: String,
      default: "",
    },
    morningMotivation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password; // Remove the password field from the returned object
  return userObject;
}

const User = mongoose.model("User", userSchema);

const originalCreate = User.create.bind(User);
const originalFindOne = User.findOne.bind(User);
const originalFindById = User.findById.bind(User);
const originalSave = User.prototype.save;

User.create = async function (data) {
  if (!isMockDb()) {
    return originalCreate(data);
  }

  const user = new User(data);
  await user.save();
  return user;
};

User.findOne = async function (query) {
  if (!isMockDb()) {
    return originalFindOne(query);
  }

  const found = getMockStore().users.find((doc) => matchesQuery(doc, query));
  return found ? User.hydrate(found) : null;
};

User.findById = async function (id) {
  if (!isMockDb()) {
    return originalFindById(id);
  }

  const found = getMockStore().users.find((doc) => String(doc._id) === String(id));
  return found ? User.hydrate(found) : null;
};

User.prototype.save = async function () {
  if (!isMockDb()) {
    return originalSave.call(this);
  }

  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  const plain = this.toObject({ depopulate: true });
  const users = getMockStore().users;
  const index = users.findIndex((doc) => String(doc._id) === String(plain._id));
  if (index >= 0) {
    users[index] = plain;
  } else {
    users.push(plain);
  }

  return this;
};

export default User;
