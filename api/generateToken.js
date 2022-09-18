require('dotenv').config()
const jwt = require('jsonwebtoken')

// the generateToken function will take two parameters,
// the first is object from body request
// and the second is the key parameter that referred to env JWT_KEY
const generateToken = (object, key) =>{
	try{
		// signature the data and create the token from it by jwt.sign() function,
		// the token will expires in 3 hours
		let token = jwt.sign(object, key, { expiresIn: '3h' });
		return token;
	} catch (error) {
		console.log("error sign");
	}

}

// testing function
// let token = generateToken({username: 'jack'}, 'bblablabla')
// console.log(jwt.decode(token))

module.exports = { generateToken }

