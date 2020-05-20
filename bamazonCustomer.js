var inquirer = require("inquirer");
var mysql = require("mysql");
var cTable = require("console.table");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "bamazon",
});

connection.connect(function (err) {
  if (err) throw err;
  console.log(`connected as id ${connection.threadId}\r\n`);
  initialPrompt();
});

function initialPrompt() {
  console.log("\r\nItems for sale:\r\n");
  connection.query("SELECT * FROM products", function (err, res) {
    if (err) throw err;
    var products = [];
    res.forEach((e) => {
      var newArray = [
        e.item_id,
        e.product_name,
        e.department_name,
        e.price.toFixed(2),
        e.stock_quantity,
      ];
      products.push(newArray);
    });

    console.table(
      ["ID", "Product", "Department", "Price", "Quantity"],
      products
    );

    purchasePrompt();
  });
}

function purchasePrompt() {
  inquirer
    .prompt([
      {
        name: "desiredId",
        message: "What is the ID of the product you would like to purchase?",
      },
      {
        name: "desiredQuantity",
        message: "How many units of the product would you like to purchase?",
      },
    ])
    .then(function (answers) {
      connection.query(
        "SELECT * FROM products WHERE ?",
        {
          item_id: answers.desiredId,
        },
        function (err, res) {
          if (err) throw err;
          if (res[0].stock_quantity >= Number(answers.desiredQuantity)) {
            updateQuantity(answers.desiredId, answers.desiredQuantity);
            console.log(
              `\r\nPurchase completed! Your total: ${res[0].price.toFixed(
                2
              )}\r\n`
            );
          } else {
            console.log("\r\nInsufficient quantity! Please try again.\r\n");
          }

          continuePrompt();
        }
      );
    });
}

function continuePrompt() {
  inquirer
    .prompt([
      {
        type: "confirm",
        name: "continue",
        message: "Continue?",
      },
    ])
    .then(function (answers) {
      if (answers.continue) {
        initialPrompt();
      } else {
        connection.end();
      }
    });
}

function updateQuantity(id, desiredQuantity) {
  var quantity = 0;
  connection.query(
    "SELECT * FROM products WHERE ?",
    {
      item_id: id,
    },
    function (err, res) {
      if (err) throw err;
      quantity = res[0].stock_quantity;
      updateDatabase(quantity, desiredQuantity, id);
    }
  );
}

function updateDatabase(quantity, desiredQuantity, id) {
  connection.query(
    "UPDATE products SET ? WHERE ?",
    [
      {
        stock_quantity: quantity - desiredQuantity,
      },
      {
        item_id: id,
      },
    ],
    function (err, res) {
      if (err) throw err;
    }
  );
}
