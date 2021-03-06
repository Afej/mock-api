const fileUtil = require("./fileUtil");
const helper = require("./helper");
const routeHandler = {};

////////////////////////////////////////////////////////////////
/////////////////// BOOK /////////
////////////////////////////////////////////////////////////////

// Book route handler
routeHandler.Books = (data, callback) => {
  const acceptableHeaders = ["post", "get", "put", "delete"];
  if (acceptableHeaders.indexOf(data.method) > -1) {
    routeHandler._books[data.method](data, callback);
  } else {
    callback(405);
  }
};

//main book route object
routeHandler._books = {};

//Post route -- for creating a book
routeHandler._books.post = (data, callback) => {
  //validate that all required fields are filled out
  var name =
    typeof data.payload.name === "string" && data.payload.name.trim().length > 0
      ? data.payload.name
      : false;
  var price =
    typeof data.payload.price === "string" &&
    !isNaN(parseInt(data.payload.price))
      ? data.payload.price
      : false;
  var author =
    typeof data.payload.author === "string" &&
    data.payload.author.trim().length > 0
      ? data.payload.author
      : false;
  var publisher =
    typeof data.payload.publisher === "string" &&
    data.payload.publisher.trim().length > 0
      ? data.payload.publisher
      : false;

  // Admin adding number of available copies
  var copies =
    typeof data.payload.copies === "string" &&
    !isNaN(parseInt(data.payload.copies))
      ? data.payload.copies
      : false;

  if (name && price && author && publisher && copies) {
    const fileName = helper.generateRandomString(30);
    fileUtil.create("books", fileName, data.payload, (err) => {
      if (!err) {
        callback(200, { message: "book added successfully", data: null });
      } else {
        callback(400, { message: "could add book" });
      }
    });
  } else {
    callback(400, { message: "Some fields are incorrect" });
  }
};

//Get route -- for geting a book
routeHandler._books.get = (data, callback) => {
  if (data.query.name) {
    fileUtil.read("books", data.query.name, (err, data) => {
      if (!err && data) {
        callback(200, { message: "book retrieved", data: data });
      } else {
        callback(404, {
          err: err,
          data: data,
          message: "could not retrieve book",
        });
      }
    });
  } else {
    callback(404, { message: "book not found", data: null });
  }
};

//Put route -- for updating a book
routeHandler._books.put = (data, callback) => {
  if (data.query.name) {
    fileUtil.update("books", data.query.name, data.payload, (err) => {
      if (!err) {
        callback(200, { message: "book updated successfully" });
      } else {
        callback(400, {
          err: err,
          data: null,
          message: "could not update book",
        });
      }
    });
  } else {
    callback(404, { message: "book not found" });
  }
};

//Delete route -- for deleting a book
routeHandler._books.delete = (data, callback) => {
  if (data.query.name) {
    fileUtil.delete("books", data.query.name, (err) => {
      if (!err) {
        callback(200, { message: "book deleted successfully" });
      } else {
        callback(400, { err: err, message: "could not delete book" });
      }
    });
  } else {
    callback(404, { message: "book not found" });
  }
};

////////////////////////////////////////////////////////////////
/////////////////// USER /////////
////////////////////////////////////////////////////////////////

// User route handler
routeHandler.User = (data, callback) => {
  const acceptableHeaders = ["post", "get", "put", "delete"];
  if (acceptableHeaders.indexOf(data.method) > -1) {
    routeHandler._user[data.method](data, callback);
  } else {
    callback(405);
  }
};

// main user route object
routeHandler._user = {
  //Post route -- for creating a user
  post: (data, callback) => {
    //validate that all required fields are filled out
    var name =
      typeof data.payload.name === "string" &&
      data.payload.name.trim().length > 0
        ? data.payload.name
        : false;

    var age =
      typeof data.payload.age === "string" && !isNaN(parseInt(data.payload.age))
        ? data.payload.age
        : false;

    if (name && age) {
      const fileName = `${name.split(" ").shift()}_${name
        .split(" ")
        .pop()}_${age}`;

      // creating unique ID for each user
      var user_id = helper.generateRandomString(6);

      data.payload.id = user_id;

      fileUtil.create("users", fileName, data.payload, (err) => {
        if (!err) {
          callback(200, {
            message: "user registered successfully",
            data: null,
          });
        } else {
          callback(400, { message: "could add user" });
        }
      });
    } else {
      callback(400, { message: "Provide both name and age" });
    }
  },
};

////////////////////////////////////////////////////////////////
/////////////////// Book lending/returning /////////
////////////////////////////////////////////////////////////////

routeHandler.lendBook = async (data, callback) => {
  if (data.method === "get" && data.query.name && data.query.book) {
    let book = await fileUtil.existing("books", data.query.book);
    let user = await fileUtil.existing("users", data.query.name);

    //only if the book and user is available
    if (book && user) {
      // console.log("available");
      // decrease the number of available copies after lending book
      fileUtil.updateCopies("books", data.query, "decrease", callback);
    } else {
      callback(405, { message: "user or book is not valid" });
    }
  } else {
    callback(405, { message: "wrong method call" });
  }
};

routeHandler.returnBook = async (data, callback) => {
  if (data.method === "put" && data.query.name && data.query.book) {
    let book = await fileUtil.existing("books", data.query.book);
    let user = await fileUtil.existing("users", data.query.name);

    //only if the book and user is available
    if (book && user) {
      // console.log("available");
      // increase the number of available copies after returning book
      fileUtil.updateCopies("books", data.query, "increase", callback);
    } else {
      callback(405, { message: "user or book is not valid" });
    }
  } else {
    callback(405, { message: "wrong method call" });
  }
};

// PING route
routeHandler.ping = (data, callback) => {
  callback(200, { response: "server is live" });
};

// not found route
routeHandler.notfound = (data, callback) => {
  callback(404, { response: "not found" });
};

module.exports = routeHandler;
