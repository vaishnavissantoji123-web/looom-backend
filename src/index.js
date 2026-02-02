import "dotenv/config";
import express from "express";
const PORT=process.env.PORT||3000;
const app=express();

app.get("/",(req,res)=>{
    res.json({message:"API server is runing"});
});
async function startServer() {
    try{
        app.listen(3000,()=>{
            console.log(`server is runing on: http://Localhost:3000:${PORT}`);
        })

    }catch(err){
        console.error(err);

    }
}
startServer();