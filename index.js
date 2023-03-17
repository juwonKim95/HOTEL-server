//common js 구문
//모듈 import ---> require("모듈")
//express 
const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require('bcrypt');
const saltRounds = 10;

//서버 생성
const app = express();
// 프로세서의 주소 포트번호
const port = 8080;
const multer = require("multer");
// 브라우져의 cors이슈를 막기 위해 설정
app.use(cors());
app.use("/upload", express.static("upload"));
// json형식 데이터를 처리하도록 설정
app.use(express.json());
// upload폴더 클라이언트에서 접근 가능하도록 설정

//diskStorage() ---> 파일을 저장할때의 모든 제어 기능을 제공
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/event/');
    },
    filename: (req, file, cb) => {
        const newFilename = file.originalname;
        cb(null, newFilename);
    }
})
const upload = multer({ storage: storage });
//post요청이 왔을때 응답처리
app.post('/upload', upload.single('img'), (req, res) => {
    console.log("등록됨")
    res.send({
        imageUrl: req.file.filename
    })
});

// mysql연결 생성
const conn = mysql.createConnection({
    host: "hera-database.c75lp1ufvzs3.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "skymin0235",
    port: "3306",
    database: "hotel"
})
// 선연결
conn.connect();


//이벤트 등록 요청 처리
app.post('/event', async (req, res) => {
    const { e_title, e_titledesc, e_img1, e_img2, e_desc, e_time, e_category } = req.body;
    conn.query(`insert into event(e_title, e_titledesc, e_img1, e_img2, e_desc, e_time,e_category) values(?,?,?,?,?,?,?)`
        , [e_title, e_titledesc, e_img1, e_img2, e_desc, e_time, e_category], (err, result, fields) => {
            if (result) {
                res.send("ok");
            } else {
                console.log(err);
            }
        })
})
//이벤트 등록 요청 처리
app.post('/room', async (req, res) => {
    const { r_name, r_img1, r_img2, r_img3, r_img4, r_size, r_price, r_bed, r_amenity, r_desc } = req.body;
    console.log(r_amenity);
    // let amenity = "";
    // for(let i=0; i<r_amenity.length; i++){
    //     amenity += `${r_amenity[i].text}*`;
    // }
    // console.log(amenity);
    conn.query(`insert into guestroom(r_name,r_img1,r_img2,r_img3,r_img4,r_size,r_price, r_bed,r_amenity, r_desc) values(?,?,?,?,?,?,?,?,?,?)`
        , [r_name, r_img1, r_img2, r_img3, r_img4, r_size, r_price, r_bed, r_amenity, r_desc], (err, result, fields) => {
            if (result) {
                res.send("ok");
            } else {
                console.log(err);
            }
        })
})
// conn.query("쿼리문", 콜백함수)
app.get("/specials/:limits", (req, res) => {
    const { limits } = req.params;
    console.log(limits);
    conn.query(`select * from event where e_category = 'special' limit ${limits}`,
        (error, result, fields) => {
            res.send(result)
        })
})
// conn.query("쿼리문", 콜백함수)
app.get("/room", (req, res) => {
    conn.query(`select * from guestroom`,
        (error, result, fields) => {
            res.send(result)
        })
})
//객실 데이터 요청
app.get("/room/:no", (req, res) => {
    const { no } = req.params;
    console.log(`번호는 ${no}`);
    conn.query(`select * from guestroom where r_no=${no}`,
        (error, result, fields) => {
            res.send(result[0]);
        })
})
//객실예약조회 요청 
app.get("/searchRoom", async (req, res) => {
    const start = req.query.start;
    const end = req.query.end;
    console.log(start, end);
    conn.query(`select rv_roomno from reservation where rv_checkin >= '${start}' and rv_checkin < '${end}'`, (err, result, fields) => {
        result = result.map(re => Number(re.rv_roomno))
        console.log(result);
        console.log(err);
        res.send(result);
    })
})
//랜덤예약코드 요청

app.get("/codeCheck", (req, res) => {
    //랜덤 예약번호 생성하기 


    const random = (length = 8) => {
        return Math.random().toString(16).substring(2, length);
    };
    const randomCode = random();
    console.log(randomCode);
    conn.query(`select rv_reno from reservation where rv_reno='${randomCode}'`, (err, result, fields) => {
        if (result.length === 0) {
            res.send(randomCode);
        } else {
            res.send("no");
        }
    })

})
//예약하기 요청
app.post('/addReservation', async (req, res) => {
    const { rv_checkin, rv_checkout, rv_adult, rv_child, rv_email,
        rv_phone,
        rv_name,
        rv_roomname,
        rv_roomno,
        rv_price,
        rv_desc,
        rv_reno } = req.body;
    conn.query(`insert into reservation(rv_checkin,rv_checkout,rv_adult,rv_child,rv_email,
        rv_phone,rv_name,rv_roomname,rv_roomno,rv_price,rv_desc,
        rv_reno) values(?,?,?,?,?,?,?,?,?,?,?,?)`
        , [rv_checkin, rv_checkout, rv_adult, rv_child, rv_email,
            rv_phone,
            rv_name,
            rv_roomname,
            rv_roomno,
            rv_price,
            rv_desc,
            rv_reno], (err, result, fields) => {
                if (result) {
                    res.send(rv_reno);
                } else {
                    console.log(err);
                }
            })

})
//http://localhost:8080/special/1
// req { params: { no: 1 }}
app.get("/special/:no", (req, res) => {
    const { no } = req.params;
    conn.query(`select * from event where e_category = 'special' and e_no=${no}`,
        (error, result, fields) => {
            res.send(result)
        })
})

//회원가입 요청
app.post("/join", async (req, res) => {
    //입력받은 비밀번호 mytextpass로 할당
    const mytextpass = req.body.m_pass;
    let myPass = "";
    const { m_name, m_pass, m_phone, m_nickname, m_add1, m_add2, m_email } = req.body;
    console.log(req.body);
    //빈문자열이 아니고 undefined가 아닐때 
    if (mytextpass != '' && mytextpass != undefined) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여
            // 콜백함수 안 hash로 돌려준다.
            bcrypt.hash(mytextpass, salt, function (err, hash) {
                myPass = hash;
                //쿼리작성
                conn.query(`insert into member(m_name, m_pass, m_phone, m_nickname, m_address1, m_address2, m_email) values('${m_name}','${myPass}','${m_phone}','${m_nickname}','${m_add1}','${m_add2}','${m_email}')
    `, (err, result, fields) => {
                    if (result) {
                        res.send("등록되었습니다.");
                    }
                    console.log(err);
                })
            });
        });
    }
    // insert into member(m_name, m_pass, m_phone, m_nickname, m_add1, m_add2)
    // values(${})

})

//로그인 요청
app.post("/login", async (req, res) => {
    //1)useremail값에 일치하는 데이터가 있는지 확인
    //2)userpass 암호화해서 쿼리 결과의 패스워드랑 일치하는지 체크 
    //{ "useremail": "admin@naver.com", "userpass": "1234" }
    const { useremail, userpass } = req.body;
    conn.query(`select * from member where m_email = '${useremail}'`,
        (err, result, fields) => {
            //결과가 undefined가 아니고 결과의 0번째가 undefined가 아닐때 
            //결과가 있을때 
            if (result != undefined && result[0] != undefined) {
                bcrypt.compare(userpass, result[0].m_pass, function (err, rese) {
                    //result == true
                    if (rese) {
                        console.log("로그인 성공");
                        res.send(result);
                    } else {
                        console.log("로그인 실패");
                        res.send("실패");
                    }
                })
            } else {
                console.log("데이터가 없습니다.");
            }
        })
})

//아이디 찾기 요청
app.post("/findid", async (req, res) => {
    const { m_name, m_phone } = req.body;
    conn.query(`select * from member where m_name='${m_name}' and m_phone='${m_phone}'`, (err, result, fields) => {
        if (result) {
            console.log(result[0].m_email);
            res.send(result[0].m_email);
        }
        console.log(err);
    })
})
//패스워드 찾기 요청
app.post("/findpass", async (req, res) => {
    const { m_name, m_email } = req.body;
    conn.query(`select * from member where m_name='${m_name}' and m_email='${m_email}'`, (err, result, fields) => {
        if (result) {
            res.send(result[0].m_email);
        }
        console.log(err);
    })
})
//패스워드 변경 요청
app.patch("/updatePw", async (req, res) => {
    const { m_pass, m_email } = req.body;
    //update 테이블 이름 
    //set 필드이름=데이터값 
    //where 조건절 update member set m_pass
    const mytextpass = m_pass;
    console.log()
    let myPass = "";
    if (mytextpass != '' && mytextpass != undefined) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여
            // 콜백함수 안 hash로 돌려준다.
            bcrypt.hash(mytextpass, salt, function (err, hash) {
                myPass = hash;
                //쿼리작성
                conn.query(`update member set m_pass='${myPass}' where m_email='${m_email}'
    `, (err, result, fields) => {
                    if (result) {
                        res.send("등록되었습니다.");
                        console.log(result);
                    }
                    console.log(err);
                })
            });
        });
    }
})

app.listen(port, () => {
    console.log("서버가 동작하고 있습니다.")
})