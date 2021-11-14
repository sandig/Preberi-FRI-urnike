const axios = require('axios');
const puppeteer = require('puppeteer');

async function main() {
    const ROOT_URL = "https://urnik.fri.uni-lj.si/timetable/fri-2021_2022-zimski-1-1/";

    var predmeti = [];

    async function preberiUrnikPredmeta(urlPredmeta, indeks) {

        const browser = await puppeteer.launch({headless: false}); // for test disable the headlels mode,
        const page = await browser.newPage();
        await page.setViewport({width: 1000, height: 926});
        await page.goto(urlPredmeta, {waitUntil: 'networkidle2'});

        var cikli = await page.evaluate(() => {
            var div = document.querySelectorAll('.grid-day-column');
            console.log(div); // console.log inside evaluate, will show on browser console not on node console

            var cikli = []
            div.forEach(element => {
                var gridEntry = element.querySelector('.grid-entry');
                if (gridEntry != null) {
                    //TODO: prebrati je potrebno še uro cikla na podlagi pozicije elementa v tabeli (glej style v .grid-entry)
                    cikli.push(gridEntry.innerText);
                }
            });

            return cikli;
        })

        //console.log(cikli);
        browser.close();

        predmeti[indeks].urnik = [];
        predmeti[indeks].urnik.push(cikli);
    }

    axios.get(ROOT_URL)
        .then(function (response) {
            // Vsebina osnovnega spletnega mesta 'Urnik FRI'
            const PREDMET_VRSTICA = "href=\"/timetable/fri-2021_2022-zimski-1-1/allocations?subject=";
            var vsebinaPoVrsticah = response.data.split(/\r\n|\n/);

            vsebinaPoVrsticah.forEach(function (vrstica, indeks) {

                if (vrstica.includes(PREDMET_VRSTICA)) {
                    var predmetSifraSplit = vrstica.split("\">")[1].split("</a")[0].split(" (");
                    var sifraSplit = predmetSifraSplit[1].replace(")", "");
                    var predmetURL = "https://urnik.fri.uni-lj.si" + vrstica.split("href=\"")[1].split("\">")[0];

                    predmeti.push({naziv: predmetSifraSplit[0], sifra: sifraSplit, predmetURL: predmetURL});
                    var indPred = predmeti.length - 1;
                    // TODO: s semaforji je potrebno omejiti na manjše število sočasnih brskalniških poizvedb (npr. 5)
                    if (indPred < 5)
                        preberiUrnikPredmeta(predmeti[indPred].predmetURL, indPred);
                }
            });

            // TODO: dodaj semafor, ki počaka vse asinhrone 'puppeteer' zahteve in shrani v JSON
            console.log(predmeti);
        })
        .catch(function (error) {
            // v primeru napake
            console.log(error);
        });
}

main().catch((err) => {
    console.log("Napaka!")
    console.error(err)
});