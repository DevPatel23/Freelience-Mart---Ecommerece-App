import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import { compare } from "bcrypt";

////////////////////////////////////////////////////      1.         REGISTER POST            ////////////////////////////////////
//
export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body; //body pase thi value lidhi... mara jeva USER pase thi value lais

    //validations
    if (!name) {
      return res.send({ message: "Name is required" });
    }
    if (!email) {
      return res.send({ message: "Email is required" });
    }
    if (!password) {
      return res.send({ message: "Password is required" });
    }
    if (!phone) {
      return res.send({ message: "Phone No is required" });
    }
    if (!address) {
      return res.send({ message: "Address is required" });
    }
    if (!answer) {
      return res.send({ message: "Answer is required" });
    }

    //check user
    const existingUser = await userModel.findOne({ email: email }); //          email ni help thi existingUser find karse

    //existing user                                                  //existing chhe etle error
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Already registerd, Please login",
      });
    }

    //register user                                                 //jo existing nathi to REGISTER karse
    const hashedPassword = await hashPassword(password);

    //save                                                //badhi details save kari
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    }).save();

    res.status(201).send({
      success: true,
      message: "User registered successfully", ////         to registration successfully         ///
      user,
    });

    //           overall error     ////
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Registration",
      error,
    });
  }
};

//////////////////////////////////////////        2.       LOGIN POST            ///////////////////////////////////////////////
//
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validations
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    // check user
    const user = await userModel.findOne({ email }); ///      email mate check karse   ///
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }
    const match = await comparePassword(password, user.password); ///  email brbr chee etle password mate check karse  //
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid password",
      });
    }

    //token create
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "Login successfully",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role, //       login thay tyre aa role made to navbar mathi ROLE na base par DASHBOARD par javay
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Login",
      error,
    });
  }
};

////////////////////////////////////            4.       FORGOT PASSWORD POST          ////////////////////////////////////////

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body; //body pase thi lese aa 3 vastu

    //validations
    if (!email) {
      res.status(400).send({ message: "Email is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }

    // check user k aava email ane answer vadu koi chhe k ni
    const user = await userModel.findOne({ email, answer });

    //jo nathi to /(false)
    if (!user) {
      return res.status(404).send({
        //return karva pade nai to aagad no code pn run thaya karse wrong aavse to pn..
        success: false,
        message: "Wrong email or answer",
      });
    }

    //jo madi gaya to  /(true)
    const hased = await hashPassword(newPassword); //               new password ne hash ma convert karvano
    await userModel.findByIdAndUpdate(user._id, { password: hased }); // ane te user no new password update kari devano ID thi
    res.status(200).send({
      success: true,
      message: "Password reset successfully",
    });

    //overall error
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

//
////////////////////////////////////            3.       TEST ROUTES: GET             ////////////////////////////////////

//jya sudhi correct TOKEN ni made tya sudhi accss ni thase
export const testController = (req, res) => {
  res.send("Protected Routes");
};

//
////////////////////////////////    4.         UPDATE PROFILE            ///////////////////////
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;

    const user = await userModel.findById(req.user._id);

    if (password && password.length < 6) {
      return res.json("Password is Required and length must be greater than 6");
    }

    // aa password ne hash pn kari daiye
    const hasedPassword = password ? await hashPassword(password) : undefined;

    //jo pass brbr to hae update karisu...
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        // email mate ni lakhiye becoz e to disabled j chhe etle update thase j ni
        password: hasedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Updating User Profile",
      error,
    });
  }
};

/////////////////             Users ORDERS GETTING Controller          /////////////////
export const userOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};

/////////////////             Admin All-ORDERS getting Controller          /////////////////
export const adminAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};

export const adminAllUsersController = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .populate("name", "email")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting all users",
      error,
    });
  }
};

export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const orders = await orderModel.findByIdAndUpdate(
      { orderId },
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating Status",
      error,
    });
  }
};
