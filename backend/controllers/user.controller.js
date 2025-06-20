const userModel = require('../models/user.model.js');
const userService = require('../services/user.service.js')
const { validationResult } = require('express-validator')
const blacklistTokenModel = require('../models/blacklistToken.model.js');

module.exports.registerUser = async (req, res, next) => {
console.log("i m here")
    const error = validationResult(req);
    if(!error.isEmpty())
    {
        return res.status(400).json({error : error.array()});
    }

    const {fullName, email, password} = req.body;

    const isUserAlreadyExist = await userModel.findOne({ email });

    if(isUserAlreadyExist) return res.status(400).json({message : 'User already exist'});

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userService.createUser({
        firstName : fullName.firstName,
        lastName : fullName.lastName,
        email, 
        password : hashedPassword
    })

    const token = user.generateAuthToken();

    res.status(201).json({user, token});
};

module.exports.loginUser = async (req, res, next) => {
    console.log(`HELLO from login`)
    const error = validationResult(req);
    if(!error.isEmpty())
    {
        return res.status(400).json({error : error.array()});
    }

    const {email, password} = req.body;

    const user = await userModel.findOne({ email }).select('+password');

    if(!user) return res.status(401).json({message : "Invalid email or password"});

    const isMatch = user.comparePassword(password);

    if(!isMatch) return res.status(401).json({message : "Invalid email or password"});

    const token = user.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({token, user});
}

module.exports.userProfile = async (req, res, next) => {
    res.status(200).json(req.user);
}

module.exports.logoutUser = async (req, res, next) => {
    res.clearCookie('token');
    const token = req.cookie.token || req.headers.authorization?.split(' ')[1];

    await blacklistTokenModel.create({ token });

    res.status(200).json({message : 'Logged out'});
}