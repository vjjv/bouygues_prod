import {
    bootstrapCameraKit,
    createMediaStreamSource,
    Transform2D,
    Injectable,
    RemoteApiService,
    RemoteApiServices,
    RemoteApiRequest,
    RemoteApiRequestHandler,
    RemoteApiStatus,
    remoteApiServicesFactory,
} from "@snap/camera-kit";

(async function () {


    const form = document.getElementById("myForm");
    form.addEventListener("submit", async function (event) {
        // Prevent the default form submission behavior
        event.preventDefault();
        let formMessageDiv = document.getElementById("cta-replay");

        // Block form if it's between 8h and 20h
        let currentHour = new Date().getHours();
        if (currentHour >= 8 && currentHour <= 20) {
          console.log("It's between 8h and 20h");
        //   formMessageDiv.textContent = "";
        } else {
          console.log("It's not between 8h and 20h");
          formMessageDiv.textContent = "Revenez demain à partir de 8h pour jouer";
          formMessageDiv.style.color = "red";
          return;
        }
        // You can access form data using form elements, for example:
        const formData = new FormData(form);
        const formDataObject = {};
        formData.forEach(function (value, key) {
            formDataObject[key] = value;
        });

        //baba
        let nbPlays = await incPlays(formDataObject["email"]);
        console.log('Participations serveur : '+nbPlays); 
        //
        let numberOfPlay = incrementPlayedGames(formDataObject["email"]);
        console.log('Participations local : ' + numberOfPlay);
        if (Number(numberOfPlay) > 3 || nbPlays >= 3) {
            document.getElementById("card-form").style.display = "none";
            document.getElementById("card-stop").style.display = "flex";
            return;
        }

        sendData(formDataObject, Number(nbPlays));
        document.getElementById("card-start").style.display = "none";
        document.getElementById("card-form").style.display = "none";

    });

    async function incPlays(mail) {
        let nbPlays = await getPlays(mail)
        // console.log('incPlays: '+ mail + ' : nbPlays: '+ nbPlays);
        return nbPlays;
    }

    async function sendData(obj, nbPlays) {
        if (nbPlays == 0) {
            let responseContact = await postContact(obj);
            console.log(responseContact.message + " ::: " + responseContact.mail);
        } else {
            console.log('No contact added because you already played ' + nbPlays + ' times.')
        }
        let randomizer = await getRandomizer();
        console.log('Randomizer : ' + randomizer);
        //Randomizer : 10
        //userRandom : 8   => ==0?
        //V2
        //Randomizer : 35
        //userRandom : 0-100 => 82<35 ?
        let userRandom = (Math.floor(Math.random() * 100))+1;
        console.log('userRandom : ' + userRandom);
        if (userRandom < randomizer) { //winner
            let responsePrize = await getPrize(obj.email);
            console.log('Prize : ' + responsePrize.mail + ' / ' + responsePrize.code);
            if (responsePrize.code != "-1") { //winner
                let responseBrevoWinner = await postBrevo({ email: obj.email, firstname: obj.firstname, lastname: obj.lastname, code: responsePrize.code });
                console.log('Brevo : ' + responseBrevoWinner.message);
                startLens(1, responsePrize.mail, responsePrize.code)
            } else { //loser
                console.log('Brevo : ' + '-1 : No code available anymore');
                startLens(1, 'loser@mail.com', '-1')
            }
        } else { //loser
            console.log('Brevo : ' + 'No mail sent because you lost');
            startLens(1, 'loser@mail.com', '-1')

        }
    }
    function incrementPlayedGames(email) {
        // Get the current number of played games for the email
        let playedGames = localStorage.getItem(email);

        // If there's no record for the phone, initialize it to 0
        if (playedGames === null) {
            playedGames = 0;
        } else {
            // If there's a record, parse it to an integer
            playedGames = parseInt(playedGames, 10);
        }

        // Increment the number of played games
        playedGames++;

        // Store the new number of played games in localStorage
        localStorage.setItem(email, playedGames.toString());
        return localStorage.getItem(email);
    }

    async function postContact(obj) {
        return new Promise(async (resolve, reject) => {
            let res = await fetch(
                "https://bouygues-404412.lm.r.appspot.com/contact?" +
                new URLSearchParams({
                    email: `${obj.email}`,
                    firstname: `${obj.firstname}`,
                    lastname: `${obj.lastname}`,
                    phone: `${obj.phone}`,
                    condition: `${obj.condition}`,
                }),
                {
                    method: "POST",
                }
            );
            let objResponse = await res.json(); // { mail : 'a@a.com', message: 'Contact added'}
            resolve(objResponse);
        });
    }

    async function postBrevo(obj) {
        return new Promise(async (resolve, reject) => {
            let res = await fetch(
                "https://bouygues-404412.lm.r.appspot.com/brevo?" +
                new URLSearchParams({
                    email: `${obj.email}`,
                    firstname: `${obj.firstname}`,
                    lastname: `${obj.lastname}`,
                    code: `${obj.code}`,
                }),
                {
                    method: "POST",
                }
            );
            let objResponse = await res.json(); // { mail : 'a@a.com', message: 'Contact added'}
            resolve(objResponse);
        });
    }

    async function getPrize(mail) {
        return new Promise(async (resolve, reject) => {
            let res = await fetch(
                "https://bouygues-404412.lm.r.appspot.com/prize?" +
                new URLSearchParams({
                    mail: mail,
                }),
                {
                    method: "GET",
                }
            );
            let objResponse = await res.json(); // { mail : 'a@a.com', code: 'ABCD'}
            resolve(objResponse);
        });
    }

    async function getRandomizer() {
        return new Promise(async (resolve, reject) => {
            let res = await fetch(
                "https://bouygues-404412.lm.r.appspot.com/randomizer",
                {
                    method: "GET",
                }
            );
            let objResponse = await res.json(); // { randomizer : '10''}
            resolve(objResponse.randomizer);
        });
    }

    async function getPlays(mail) {
        return new Promise(async (resolve, reject) => {
            let res = await fetch(
                "https://bouygues-404412.lm.r.appspot.com/plays?" +
                new URLSearchParams({
                    mail: mail,
                }),
                {
                    method: "GET",
                }
            );
            let objResponse = await res.json(); // { plays: '3'}
            resolve(objResponse.plays);
        });
    }

    ///////////////////
    //SNAPCHAT CODE////
    ///////////////////
    const damsService = {
        apiSpecId: "87e3aee3-0a82-4fbd-8d71-b4534c79704c",
        getRequestHandler(request) {
            if (request.endpointId !== "prize") return;

            return async (reply) => {
                const res = await fetch(
                    `https://bouygues-404412.lm.r.appspot.com/prize?mail=${request.parameters.mail}`,
                    {
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                const text = await res.text();

                reply({
                    status: "success",
                    metadata: {},
                    body: new TextEncoder().encode(text),
                });

                const obj = JSON.parse(text);
                console.log("CODE : " + obj.code);
                carton(obj.mail, obj.code);
            };
        },
    };

    //var cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNjk4NDEyNDI1LCJzdWIiOiIxMzk1NDk4MC1hYjQwLTQwMTAtYThhZi02NmI5NWYyM2RlYmR-U1RBR0lOR34xOTcxMTQ2OC1jZTY3LTQ5OTgtYmQ5ZS0xNzAwNTRkYTk5NzgifQ.WzqacKQZQIh5SUMC7V45ndhVsk8jjI3BxiwhQVetkz4' })
    //V2 working here
    // var cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNjk4NDEyNDI1LCJzdWIiOiIxMzk1NDk4MC1hYjQwLTQwMTAtYThhZi02NmI5NWYyM2RlYmR-U1RBR0lOR34xOTcxMTQ2OC1jZTY3LTQ5OTgtYmQ5ZS0xNzAwNTRkYTk5NzgifQ.WzqacKQZQIh5SUMC7V45ndhVsk8jjI3BxiwhQVetkz4' }, (container) =>
    var cameraKit = await bootstrapCameraKit(
        {
            apiToken:
                "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNjk4NDEyNDI1LCJzdWIiOiIxMzk1NDk4MC1hYjQwLTQwMTAtYThhZi02NmI5NWYyM2RlYmR-UFJPRFVDVElPTn4xN2IzNWUzZC1iZWYwLTQxNzUtYTA2Ny05NTNiYmIyOGYyNTQifQ.tqyXjMntFKLnubtZailODeASvccrQziURDt1shDsznE",
        },
        (container) =>
            container.provides(
                Injectable(
                    remoteApiServicesFactory.token,
                    [remoteApiServicesFactory.token],
                    (existing) => [...existing, damsService]
                )
            )
    );

    const session = await cameraKit.createSession();
    let canvas = document.getElementById("canvas");
    canvas.replaceWith(session.output.live);

    const { lenses } = await cameraKit.lensRepository.loadLensGroups([
        "19bedafd-5ca3-4431-898d-002694113ffe",
    ]);
    startLens(0);

    let mediaStream;
    let source;
    async function startLens(lens, mail, code) {
        console.log("startlens " + lens);
        session.applyLens(lenses[lens], { mail: mail, code: code });
        // let mediaStream = await navigator.mediaDevices(getUserMedia({ video: true }));
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: "environment",
            },
        });
        source = createMediaStreamSource(mediaStream, {
            // transform: Transform2D.MirrorX,
            fpsLimit: 30,
            cameraType: "back",
        });
        await session.setSource(source);
        session.setSource(source);
        session.source.setRenderSize(window.innerWidth * 1.5, window.innerHeight * 1.5);
        session.play();
        let canvasRender = document.querySelector('canvas');
        canvasRender.style.width = '100%'
        canvasRender.style.height = '100%'
    }


    // let ctx = canvas.getContext("webgl2");
    // console.log(ctx);
    // var rgba;
    // var out;
    // setTimeout(() => {
    //     ctx = canvas.getContext("webgl2");
    //     out = new Uint8Array(4);
    //     ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.FLOAT, out); //UNSIGNED_BYTE, FLOAT, INT, BYTE   //RGBA_INTEGER
    //     console.log("result");
    //     console.log(out);
    // }, 1000);
})();
