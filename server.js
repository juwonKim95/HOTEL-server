//common js 구문
//모듈 import ---> require("모듈")
//express
const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const multer = require("multer");
const bcrypt = require('bcrypt');
const saltRounds = 10;

//서버 생성
const app = express();
//프로세서의 주소 포트번호
//리액트는 포트번호 3000번 쓴다.(구분하는 기준이 됨)
const port = 8080;
// const multer = 
//브라우저의 cors이슈를 막기위해 설정
app.use(cors());
//json형식 데이터를 처리하도록 설정
app.use(express.json());
//upload폴더 클라이언트에서 접근 가능하도록 설정
app.use("/upload",express.static("upload"));
//storage 생성
const storage = multer.diskStorage({
    destination: (req, file, cd)=>{
        cd(null, 'upload/event/');
    },
    filename: (req, file, cd)=>{
        const newFilename = file.originalname;
        cd(null, file.originalname)
    }
})
//upload 객체 생성하기
const upload = multer({ storage: storage });
//upload 경로로 post요청시 응답 구현하기
app.post("/upload", upload.single("img"), (req, res)=>{
    console.log("등록됨")
    res.send({
        imageUrl: req.file.filename
    })
}); 
//mysql연결 생성
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    port: 3306,
    database: "hotel"
})
//선연결
conn.connect();
//conn.query("쿼리문", "콜백함수")
app.get("/specials/:limits", (req, res)=>{
    const { limits } = req.params;
    conn.query(`select * from event where e_category = 'special' limit ${limits}`,
    (error, result, fields)=>{
        res.send(result)
    })
})
//객실 데이터 요청
app.get("/room/:no", (req, res)=>{
    const {no} =req.params;
    conn.query(`select * from guestroom where r_no=${no}`,
    (error, result, fields)=>{
        res.send(result[0])
        
    })
})
//http://localhost:8080/special/1
// req { params: { no:1 }}
app.get("/special/:no", (req, res)=>{
    const {no} = req.params;
    conn.query(`select * from event where e_category = 'special' and e_no=${no}`,
    (error, result, fields)=>{
        res.send(result);
    })
})
//객실 데이터 불러오기
app.get("/room", async (req, res)=>{
    conn.query('select * from guestroom',(err, result,fields) => {
        res.send(result);
        console.log(err);
    })
})
//회원가입 요청
app.post("/join", async (req, res) => {
    //입력받은 비밀번호 mytextpass로 할당
    const mytextpass = req.body.m_pass;
    let myPass = "";
    const {m_name, m_pass, m_phone, m_nickname, m_add1, m_add2, m_email} = req.body;
    console.log(req.body);
    //빈 문자열이 아니고 undefined가 아닐때
    if(mytextpass != '' && mytextpass != undefined){
        bcrypt.genSalt(saltRounds, function(err, salt) {
            //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여
            //콜백함수 안 hash로 돌려준다
            bcrypt.hash(mytextpass, salt, function(err, hash) {
                myPass = hash;
                //쿼리작성
                conn.query(`insert into member(m_name, m_pass, m_phone, m_nickname, m_address1, m_address2, m_email) values ('${m_name}','${myPass}','${m_phone}','${m_nickname}','${m_add1}','${m_add2}','${m_email}')
                `,(err, result, fields)=>{
                if(result){
                    res.send("등록되었습니다.");
                }else {
                    console.log(err);
                }
            })
        });
        });
    }
    //insert into member(m_name,m_pass, m_phone, m_nickname, m_add1, m_add2, m_email)
    // values(${})

})

//로그인 요청
app.post("/login", async (req, res)=>{
    //useremail값에 일치하는 데이터가 있는지 확인
    //userpass 암호화에서 쿼리 결과의 패스워드와 일치하는지 체크
    const { useremail, userpass} = req.body;
    conn.query(`select * from member where m_email = '${useremail}'`, 
    (err, result, fields)=>{
        console.log(result)
        //결과가 undefined가 아니고 결과의 0번째가 undefined가 아닐때
        //결과가 있을때
        if(result != undefined && result[0] != undefined) {
            bcrypt.compare(userpass, result[0].m_pass, function(err,rese){
                //result == true
                if(rese){
                    console.log("로그인 성공");
                    res.send(result);
                }else {
                    console.log("로그인 실패");
                    res.send("실패");
                }
            })
        }else {
            console.log("데이터가 없습니다.");
        }
    })
})
//아이디 찾기 요청
app.post("/findid",async (req, res)=> {
    const {m_name, m_phone} = req.body;
    conn.query(`select * from member where m_name='${m_name}' and m_phone='${m_phone}'`,(err, result, fields)=>{
        if(result){
            console.log(result);
            res.send(result[0].m_email);
        }
        console.log(err);
    })
})
//비밀번호 찾기 요청
app.post("/findpass",async (req, res)=> {
    const {m_name, m_email} = req.body;
    conn.query(`select * from member where m_name='${m_name}' and m_email='${m_email}'`,(err, result, fields)=>{
        if(result){
            res.send(result[0].m_email);
        }
        console.log(err);
    })
})
//패스워드 변경 요청
app.patch("/updatePw", async(req, res) => {
    const {m_pass, m_email} = req.body;
    //update 테이블 이름
    //set 필드이름=데이터값
    //where 조건절 update member set m_pass
    const mytextpass = m_pass;
    let myPass = "";
    if(mytextpass != '' && mytextpass != undefined){
        bcrypt.genSalt(saltRounds, function(err, salt) {
            //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여
            //콜백함수 안 hash로 돌려준다
            bcrypt.hash(mytextpass, salt, function(err, hash) {
                myPass = hash;
                //쿼리작성
                conn.query(`update member set m_pass='${myPass}' where m_email='${m_email}'
                `,(err, result, fields)=>{
                if(result){
                    res.send("등록되었습니다.");
                    console.log(result);
                }
                console.log(err);
                
            })
        });
        });
    }
})
//이벤트 등록 요청
app.post('/event', async (req, res) => {
    const {
        e_title, 
        e_titledesc, 
        e_time,  
        e_desc, 
        e_img1, 
        e_img2, 
        e_category} 
 = req.body;
// conn.query("쿼리문",콜백함수)
// conn.query("쿼리문",[변수.........],콜백함수)
 //insert into 테이블 이름(필드명....) value(값....),(err, res, fields)=>{})
 //insert into 테이블 이름(필드명....) value(?,?,?,?,?,?),[변수명,.....]
 conn.query(`insert into event(e_title, 
    e_titledesc, 
    e_time,  
    e_desc, 
    e_img1, 
    e_img2, 
    e_category) values(?,?,?,?,?,?,?)`,
    [e_title, 
        e_titledesc, 
        e_time,  
        e_desc, 
        e_img1, 
        e_img2, 
        e_category],(err, result, fields)=>{
            if(result){
                console.log(result);
                res.send("ok");
            }else {
                console.log(err);
            }
        })
})
//객실등록요청
app.post('/room', async (req,res)=>{
    const { r_name,r_size,r_price,r_bed,r_amenity,r_desc,r_img1,r_img2,r_img3,r_img4
    }= req.body;
     conn.query(`insert into guestroom(r_name,r_size,r_price,r_bed,r_amenity,r_desc,r_img1,r_img2,r_img3,r_img4) 
     value(?,?,?,?,?,?,?,?,?,?)`,
     [r_name,r_size,r_price,r_bed,r_amenity,r_desc,r_img1,r_img2,r_img3,r_img4],
     (err,result, fields)=> {
        if(result){
            res.send("ok");
        }else {
            console.log(err);
        }
     })
})

app.listen(port, ()=>{
    console.log("서버가 동작하고 있습니다.")
})


//객실예약조회 요청
app.get("/searchRoom", async (req,res)=>{
    //쿼리스트링 데이터 받기
    const { start, end } = req.query;
    //"2023-02-13" "2023-02-16"
    //select rv_roomno from reservation
    //where rv_checkin >='${start}' and rv_checkin < '${end}'
    console.log(start,end);
    conn.query(`select rv_roomno from
    reservation where rv_checkin >= '${start}' and rv_checkin < '${end}'`,(err, result,fields)=>{
        // [ {rv_roomno: '21'},{rv_roomno: '22'}] ----> ['21','22'] ---> [21,22]
        result = result.map(re=> Number(re.rv_roomno))
        console.log(result);
        res.send(result);
    })
})