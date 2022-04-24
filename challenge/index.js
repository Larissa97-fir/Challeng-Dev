
import fs from 'fs'

const validateEmail = (email) => {
    return email
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

const cvsToJson = async (cvsString = "") => {
    const table = cvsString.split('\n')
    const header = table[0].replace("\r", '').split(",")
    const infoStudents = []

    for (let i = 1; i < table.length; i++) {
        //É usado a virgula para separar os valores, porem alguns valores podem incluir neles (com o uso das aspas antes), a propria virgula por isso uso um rejex para quebrar os valores entre as aspas e depois os valores entre as virgulas, o que me gera alguns valores undefined que eu filtro posteriormente.
        const rawLine = table[i].replace("\r", '').split(/,"([^\"]*)\",|,/).filter(value => value !== undefined)

        const line = {
            address: []
        }
        let groupText = ""
        for (let j = 0; j < header.length; j++) {
            if (!rawLine[j]) {
                //Caso propridade chegue com valor vazio vou para a proxima iteração
                continue;
            }
            if (header[j] === "group") {
                groupText += "," + rawLine[j]
            } else if (header[j].includes(' ')) {
                // As únicas propriedades que possuem espaço são as de endereço

                const address = header[j].replaceAll('"', "").split(" ")
                const newAddress = ({
                    type: address[0],
                    tags: address.slice(1),
                    address: rawLine[j]
                })
                if (newAddress.type === "phone") {
                    newAddress.address = "55" + newAddress.address.replace(/[^0-9]/g, '')
                } else if (newAddress.type === "email") {
                    const addresses = newAddress.address.split(/\/| /)
                    //Logica especifica para e-mail, pois identifiquei que pode haver mais de um.
                    for (const address of addresses) {
                        const { type, tags } = newAddress
                        if (validateEmail(address)) {
                            const newAddressEmail = ({
                                type,
                                tags,
                                address
                            })
                            line.address.push(newAddressEmail)
                        }
                    }
                    continue
                }
                line.address.push(newAddress)
            } else {
                line[header[j]] = rawLine[j]
            }
        }
        line.see_all = line.see_all == 1 || line.see_all === "yes" ? true : false;
        line.invisible = line.invisible == 1 || line.invisible === "yes" ? true : false;

        line.group = groupText
            .replaceAll('"', "")
            .split(/,|\//)
            .map((oneGroup) => oneGroup.trim())
            .filter((oneGroup) => oneGroup)
        infoStudents.push(line)
    }

    outputJson(infoStudents)
}

const outputJson = (infoStudents) => {
    fs.writeFile("./challenge/output.json", JSON.stringify(infoStudents),
        (err) => {

            // Checking for errors
            if (err) {
                console.log("Algo deu errado")
                return
            }

            console.log("Verifique o arquivo output.json");

        }
    )
}

const readFile = () => {
    fs.readFile('./challenge/input.csv', (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        cvsToJson(data.toString())
    })
}
readFile()