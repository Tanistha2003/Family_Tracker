import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "xxxx",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId=1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query("SELECT county_code FROM visitedcountries JOIN users ON users.id=visitedcountries.user_id WHERE user_id=$1;",[currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.county_code);
  });
  return countries;
}

async function getUsers(){
  const result = await db.query("SELECT * FROM users;");
  users=result.rows;

  return users.find((user)=>user.id==currentUserId);
}


app.get("/", async (req, res) => {

    
    const countries = await checkVisisted();
    const userDetails=await getUsers();

   

  console.log(users);


  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: userDetails.color,
  });

});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT county_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.county_code;

    //console.log(countryCode);

    try {
      await db.query(
        "INSERT INTO visitedcountries (county_code,user_id) VALUES ($1,$2) ",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  const result=req.body.add;

  if(result==="new")
    res.render("new.ejs");
  else
  {
    currentUserId=req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {

  const userName=req.body.name;
  const userColor=req.body.color;

  const result=await db.query("INSERT INTO users (name,color) VALUES ($1,$2) RETURNING *;",
    [userName,userColor]);


    //console.log(result.rows[result.rows.length-1]);
    
    currentUserId=result.rows[result.rows.length-1].id;

  res.redirect("/");
  
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
