const fs = require("fs");
const path = require("path");
const helper = require("./helper");
var lib = {
  baseDir: path.join(__dirname, "/../.data/"),
};

//creating
lib.create = (dir, filename, data, callback) => {
  //open file for writing
  const filePath = lib.baseDir + dir + "\\" + filename + ".json";
  fs.open(filePath, "wx", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      //convert the data to string
      const stringData = JSON.stringify(data);
      //write th file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);
            } else {
              callback("Error closing the new file");
            }
          });
        } else {
          callback("Error writing to new file");
        }
      });
    } else {
      callback("could not creat new file, it may already exist");
    }
  });
};

//reading
lib.read = (dir, filename, callback) => {
  const filePath = lib.baseDir + dir + "\\" + filename + ".json";
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (!err && data) {
      callback(false, JSON.parse(data));
    } else {
      callback(err, data);
    }
  });
};

//checking if a file exist
lib.existing = async (dir, filename) => {
  const filePath = lib.baseDir + dir + "\\" + filename + ".json";

  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  }
};

//updating
lib.update = (dir, filename, data, callback) => {
  const filePath = lib.baseDir + dir + "\\" + filename + ".json";
  //open the file
  fs.open(filePath, "r+", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      fs.readFile(fileDescriptor, "utf-8", (err, bookToUpdate) => {
        if (!err && bookToUpdate) {
          let updatedBook = helper.formatObject(JSON.parse(bookToUpdate), data);
          var updatedData = JSON.stringify(updatedBook);
          //truncate the fule for update;
          fs.truncate(fileDescriptor, (err) => {
            if (!err) {
              fs.writeFile(filePath, updatedData, (err) => {
                if (!err) {
                  fs.close(fileDescriptor, (err) => {
                    if (!err) {
                      callback(false);
                    } else {
                      callback("error closing the file");
                    }
                  });
                } else {
                  callback("error writing to existing file");
                }
              });
            }
          });
        } else {
          callback(err);
        }
      });
    } else {
      callback("could not open file for updating, maybe it does not exist");
    }
  });
};

//updating available copies of books
lib.updateCopies = async (dir, query, action, callback) => {
  //use the fs module with promises
  const fsPromises = fs.promises;
  const filePath = lib.baseDir + dir + "\\" + query.book + ".json";

  try {
    //open the file to get fileDescripteor
    const filehandle = await fsPromises.open(filePath, "r+");

    //get the current content of the book
    let bookToUpdate = await fsPromises.readFile(filePath, "utf-8");
    bookToUpdate = JSON.parse(bookToUpdate);

    let copies;
    let activity;
    let bookCopies = parseInt(bookToUpdate.copies);

    if (action === "decrease") {
      // check if book has enough copies to return
      if (bookCopies === 0) {
        //close file
        await filehandle.close();
        callback(400, {
          message: "book not available",
        });
        return;
      } else {
        copies = (bookCopies - 1).toString();
        activity = "borrow";
      }
    }

    if (action === "increase") {
      copies = (bookCopies + 1).toString();
      activity = "return";
    }

    //update the copies available
    let updatedBook = helper.formatObject(bookToUpdate, { copies });
    let updatedData = JSON.stringify(updatedBook);
    fsPromises.truncate(filePath);
    await fsPromises.writeFile(filePath, updatedData);

    //close file
    await filehandle.close();
    callback(200, {
      message: `successfully ${activity}ed book`,
      data: updatedBook,
    });
  } catch (err) {
    callback(400, {
      err,
      data: null,
      message: `could not update book copies`,
    });
  }
};

//Delete File
lib.delete = (dir, filename, callback) => {
  const filePath = lib.baseDir + dir + "\\" + filename + ".json";
  fs.unlink(filePath, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
  z;
};

module.exports = lib;
