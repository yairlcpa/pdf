// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register("./sw.js")
//   .then((reg) => console.log("sw Registred", reg))
//   .catch((err) => console.log ("sw NOT Registred !", err));}

// GLOBAL VARIABELS
const PDF=PDFLib.PDFDocument, deg=PDFLib.degrees;
let oldPdf, newPdf, pdfDoc, pdfLength, pdfName, saveFile="";
// GLOBAL FUNCTIONS
cl = (txt) => console.log(txt);
qs = (el, parent = document) => parent.querySelector(el);

Msgbox = (title,txt) => {qs("#msgbox").classList.toggle("mask-show"); qs("#msgbox").children[0].classList.toggle("msgbox-show"); qs("#msg-title").innerText=title; qs("#msg-txt").innerHTML=txt; }
Droparea_Listeners();

// LOAD PDF
function Load_File(f) {
  pdfName = f.files[0].name
  const file = f.files[0], ru = new FileReader(), ra = new FileReader();
  qs("#load-file-msg").classList.add("d-none"); qs("#pdf-frame").classList.remove("d-none");
  ru.readAsDataURL(file); ru.onload = () => { fetch(ru.result).then(res=>res.blob()).then(blob=>qs('#pdf-frame').src=URL.createObjectURL(blob)); }
  ra.readAsArrayBuffer(file); ra.onload = () => { oldPdf = ra.result; Load_pdfDoc() }
}
async function Load_pdfDoc() {
  qs("#pages-input").focus(); qs("#save-as-link").classList.remove("d-none");
  pdfDoc = await PDF.load(oldPdf);
  pdfLength = pdfDoc.getPages().length;
}

// ACTIONS
function _Pages(action, deg = 0) {
  const pgInput = qs("#pages-input").value, splitArr = Split_Text(pgInput); delArr = [];
  const inpStr = pgInput.replaceAll(' ', '').replaceAll(',', '').replaceAll(';', '').replaceAll('-', '');
  if (isNaN(inpStr)) Msgbox("שגיאה בהזנת טווח","פורמט טווח: 1, 3-5 ; 8");
  else if(pdfName==undefined) Msgbox("שגיאה", "יש לטעון קובץ PDF");
  else if (splitArr[0] == "err") Msgbox("שגיאה", splitArr[1]);
  else {
    if (action == "extract")
      New_Pdf(splitArr);
    else if (action == "delete") {
      for (i in "_".repeat(pdfLength)) if (splitArr.indexOf(parseInt(i)) == -1) delArr.push(parseInt(i))
      New_Pdf(delArr);
    }
    else if (action == "rotate") {
      const allPg = [...Array(pdfLength).keys()].map(i => i);
      New_Pdf(allPg, splitArr, deg);
    }
    else if(action=="split")
      SplitPdf()
  }
}

// NEW PDF
async function New_Pdf(pgArr, rotArr = [], dg = 0) {
  newPdf = await PDF.create();
  for (p of pgArr) {
    [pg] = await newPdf.copyPages(pdfDoc, [p])
    if (rotArr.indexOf(p) != -1) pg.setRotation(deg(dg));
    newPdf.addPage(pg)
  }
  pdfDoc = newPdf; pdfLength = pdfDoc.getPages().length; 
  qs("#pages-input").value = "";// qs("#pages-input").classList.add = "text-bg-secondary";
  saveFile = await newPdf.saveAsBase64({ dataUri: true });
  fetch(saveFile).then(res=>res.blob()).then(blob=>qs('#pdf-frame').src=URL.createObjectURL(blob)); 
  qs('#pdf-frame').src = saveFile;
}
function _SaveAs() {
  if (saveFile.length>0) {
    const a = qs("#save-as-link"); a.href = saveFile; a.download = pdfName;}
  else
    Msgbox("שגיאה","לא בוצעה כל פעולה על הקובץ")
}

// CONVERT TEXT TO ARRAY
function Split_Text(txt) {
  if (txt.length == 0) return ["err", "נא להזין טווח דפים"];
  else {
    try {
      if (txt.slice(-1)=="-") txt += pdfLength.toString();
      const pages = []; 
      txt = txt.replaceAll(' ', '').replace(';', ',')
      for (const i of txt.split(",")) {
        if (i.search("-") == -1)
          pages.push(parseInt(i) - 1);
        else {
          const t = i.split("-");
          for (let j = parseInt(t[0]); j < parseInt(t[1]) + 1; j++)
            pages.push(j - 1);
        }
      }
      if (Math.max(...pages) > pdfLength) return ["err", "טווח הדפים גבוה מגודל הקובץ"];
      else return (pages)
    }
    catch {
      return ["err", `שגיאה בהזנת טווח \nפורמט טווח: 1, 3-5 ; 8`];
    }
  }
}

// DRAG & DROP
function Droparea_Listeners() {
  qs('.drop-area').addEventListener('dragover', (e) => { e.preventDefault(); qs('.drop-area').classList.add("drop-area-active") });
  qs('.drop-area').addEventListener('dragenter', (e) => { e.preventDefault(); qs('.drop-area').classList.add("drop-area-active") });
  qs('.drop-area').addEventListener('dragleave', (e) => { e.preventDefault(); qs('.drop-area').classList.remove("drop-area-active") });
  qs('.drop-area').addEventListener('drop', (e) => { e.preventDefault(); handleDrop(e) });
}
function handleDrop(f) {
  qs('.drop-area').classList.remove("drop-area-active");
  Load_File(f.dataTransfer);
}
