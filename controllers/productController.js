import fs from "fs";
import productModel from "../models/productModel.js";
import slugify from "slugify";
import categoryModel from "../models/categoryModel.js";
import braintree from "braintree";
import orderModel from "../models/orderModel.js";
// import orderModel from "../models/categoryModel.js";
import dotenv from "dotenv";

//config
dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

////////////                       CREATE Product                             ////////////
export const createProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files; //     img mate FILES mathi get karyu
    // fprmidable na lidhe BODY mathi GET nai thay, FIELDS mathi GET karvu padse

    //validations
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is required" });
      case !description:
        return res.status(500).send({ error: "Description is required" });
      case !price:
        return res.status(500).send({ error: "Price is required" });
      case !category:
        return res.status(500).send({ error: " Category is required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is required" });
      case photo && photo.size > 100000: //                                     photo mate nu validation
        return res
          .status(500)
          .send({ error: "Photo is required and should be less than 1 MB" });
    }

    //                                               pela khali new productModel thi banai daiye ane save pachhi karisu
    const products = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }

    await products.save(); //                   ahi save karye, aagad na badha code ma sathe j new Model lakhi ne save karta hata

    res.send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Creating Product",
      error,
    });
  }
};

////////////                   GET ALL Products                        ////////////
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .select("-photo")
      .sort({ createdAt: -1 }) //                    product ne create-time na aadhare, list ma batavse
      .populate("category"); //                      to akhi category data show thase, jo ni lakhe to khali id j aavse

    res.status(201).send({
      success: true,
      totalCount: products.length,
      message: "Getting all Products successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Getting All Products",
      error,
    });
  }
};

////////////                    GET SINGLE Products                    ////////////
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      // slug thi GET karta chhe etle aavi rite pn lakhay / ni to uper const thi slug banai ne pacchi ahi khali slug lakhe to pn chale
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");

    res.status(201).send({
      success: true,
      message: "Product successfully Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Getting Single Product",
      error,
    });
  }
};

////////////                         GET PHOTO                     ////////////
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo"); //       pid thi GET karsu etle

    //                         photo mate jovanu k photo.data made --> to photo.contentType thi "Content-type" ma set kari devanu..
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.send(product.photo.data); //                               ane send ma aaj photo.data moklvano
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Getting Photo",
      error,
    });
  }
};

////////////                       DELETE Product                     ////////////
export const deleteProductController = async (req, res) => {
  try {
    await productModel
      .findByIdAndDelete(req.params.pid) //       pid thi DELETE karsu etle
      .select("-photo");

    res.send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Deleting Product",
      error,
    });
  }
};

////////////                   UPDATE Product                  ////////////
export const updateProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    //validations
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is required" });
      case !description:
        return res.status(500).send({ error: "Description is required" });
      case !price:
        return res.status(500).send({ error: "Price is required" });
      case !category:
        return res.status(500).send({ error: " Category is required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is required" });
      case photo && photo.size > 100000:
        return res
          .status(500)
          .send({ error: "Photo is required and should be less than 1 MB" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();

    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Updating Product",
      error,
    });
  }
};

////////////                 FILTER Product                      ////////////
export const productFilterController = async (req, res) => {
  try {
    const { checked, radio } = req.body; //je aapne joiye te body ma thi lidhu FILTER mate
    let args = {}; //                    args ma banne filter ni value aavse

    // note ma thi vachi levu explanation
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

    const products = await productModel.find(args); // args ma Filter ni value aavse, filter ma je select kre te

    res.status(200).send({
      success: true,
      products, //                       args na aadhare PRODUCTS find kari ne aapse mane
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while filtering",
      error,
    });
  }
};

/////////////////                Product COUNT Controller                   /////////////////
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Counting Products",
      error,
    });
  }
};

/////////////////                    Per-page Product Controller              /////////////////
export const productListController = async (req, res) => {
  try {
    const perPage = 3;
    const page = req.params.page ? req.params.page : 1; //aa dynamically page add karvani chhe API ma etle ahi thi GET krye
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in per-page product",
      error,
    });
  }
};

/////////////////                     SEARCH Product Controller               /////////////////
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;

    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(results); //                                 aa rite res.send karisu
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in search product",
      error,
    });
  }
};

/////////////////               related Product Controller                     /////////////////
export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;

    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");

    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting Related Product",
      error,
    });
  }
};

/////////////////              CATEGORY wise Product Controller                   /////////////////
export const productCategoryController = async (req, res) => {
  try {
    //categoryModel ne import karvu, slug na aadhare cat ne GET karva mate karvu padyu
    const category = await categoryModel.findOne({ slug: req.params.slug });

    const products = await productModel.find({ category }).populate("category");

    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting product by category",
      error,
    });
  }
};

/////////////////             Paymnet Gateway TOKEN Controller          /////////////////
export const brainTreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

/////////////////             Paymnet Gateway PAYMENT Controller          /////////////////
export const brainTreePaymentController = async (req, res) => {
  try {
    const { cart, nonce } = req.body;

    let total = 0;
    cart.map((i) => {
      total += i.price;
    });

    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new orderModel({
            products: cart,
            payment: result,
            buyer: req.user._id,
          }).save();
          res.json({ ok: true });
          console.log(result);
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
