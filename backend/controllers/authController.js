import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const signToken = (id) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPRIRES_IN || "30d";
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn,
  });
}

export const register= async (req, res) => {
    try{
        const { name, email, password } = req.body;
        if(!name || !email || !password){
            return res.status(400).json({ message: "Please provide name, email and password" });
        }
        if(password.length < 6){
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if(userExists){
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password
        });
        if(user){
            const token = signToken(user._id);
            const userData = {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                morningMotivation: user.morningMotivation,
            };
            res.status(201).json({
                user: userData,
                token,
                ...userData,
            });
        }else{
            res.status(400).json({ message: "Invalid user data" });
        }   
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({ message: "Please provide email and password" });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if(user && (await user.matchPassword(password))){
            const token = signToken(user._id);
            const userData = {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                morningMotivation: user.morningMotivation,
            };
            res.json({
                user: userData,
                token,
                ...userData,
            });
        }else{
            res.status(401).json({ message: "Invalid email or password" });
        }
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

export const me = async (req, res) => {
    res.json({user: req.user});
}

export const updateProfile = async (req, res) => {
    try{
        const user = await User.findById(req.user._id);
        if(user){
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if(req.body.password){
                if(req.body.password.length < 6){
                    return res.status(400).json({ message: "Password must be at least 6 characters" });
                }
                user.password = req.body.password;
            }
            const updatedUser = await user.save();
            const userData = {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                morningMotivation: updatedUser.morningMotivation,
            };
            res.json({
                user: userData,
                token: signToken(updatedUser._id),
                ...userData,
            });
        }else{
            res.status(404).json({ message: "User not found" });
        }
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}
