import OctoFarmClient from "../octofarm.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import {returnHistory, returnHistoryUsage, returnDropDown} from "./filamentGrab.js";
import tableSort from "../functions/tablesort.js";
import Validate from "../functions/validate.js";
window.onload = function () {tableSort.makeAllSortable();};

//Setup history listeners
document.getElementById("historyTable").addEventListener("click", e => {
  //Remove from UI
  e.preventDefault();
  History.delete(e);
});
document.getElementById("historyTable").addEventListener("click", e => {
  //Remove from UI
  e.preventDefault();
  History.edit(e);
});
let historyList = [];
$("#historyModal").on("hidden.bs.modal", function(e) {
  document.getElementById("historySaveBtn").remove();
  document.getElementById("historyUpdateCostBtn").remove();
});



export default class History {
  static returnFilamentUsage(id){

    if(id.job.filament === null) {
      id.job.filament = {
        tool0: {
          length: 0
        }
      }
    }
      let length = id.job.filament.tool0.length / 1000
      if(length === 0){
        return ''
      }else{
        let radius = parseFloat(1.75) / 2
        let volume = (length * Math.PI * radius * radius)
        let usage = volume * parseFloat(1.24)
        return length.toFixed(2) + "m / " + usage.toFixed(2) + "g";
      }
  }



  static async get() {
    let newHistory = await OctoFarmClient.get("history/get");
    historyList = await newHistory.json();
    for (let i = historyList.history.length; i--;) {
      let printerCost = Calc.returnPrintCost(historyList.history[i].printHistory.costSettings, historyList.history[i].printHistory.printTime)
      document.getElementById("printerCost-" + historyList.history[i]._id).innerHTML = printerCost;
      let filamentString = "";
      let filamentUsage = null;
      let filamentCostText = "";
      let totalCost = 0;
      if(typeof historyList.history[i].printHistory.job !== 'undefined') {
          if (typeof historyList.history[i].printHistory.job.filament !== 'undefined' && historyList.history[i].printHistory.job.filament !== null) {
            const keys = Object.keys(historyList.history[i].printHistory.job.filament)
            let filamentCostArray = [];
            filamentCostArray.push(parseFloat(printerCost));
            let gramArray = [];
            for (let f = 0; f < keys.length; f++) {
              if (historyList.history[i].printHistory.success) {
                let filamentCost = "";
                if (Array.isArray(historyList.history[i].printHistory.filamentSelection)) {
                  if (historyList.history[i].printHistory.filamentSelection[f] !== null) {
                    filamentString += `<b>Tool ${keys[f].substring(4, 5)}: </b>` + await returnHistory(historyList.history[i].printHistory.filamentSelection[f]) + "<br>"
                    filamentUsage = returnHistoryUsage(historyList.history[i].printHistory);
                    let validateUsage = Validate.stripHTML(filamentUsage[f])
                    validateUsage = validateUsage.split(" / ").pop();
                    gramArray.push(validateUsage)
                    filamentCost += Calc.returnFilamentCost(historyList.history[i].printHistory.filamentSelection[f], validateUsage);
                    filamentCostArray.push(parseFloat(filamentCost));
                    filamentCostText += `<b>Tool ${keys[f].substring(4, 5)}: </b>`+filamentCost + "<br>";
                  } else {
                    filamentString += `<b>Tool ${keys[f].substring(4, 5)}: </b>` + "(No Spool)" + "<br>"
                    filamentUsage = `<b>Tool ${keys[f].substring(4, 5)}: </b>` + History.returnFilamentUsage(historyList.history[i].printHistory)
                  }
                } else {
                  //Old when it isn't an array...
                  if (historyList.history[i].printHistory.filamentSelection !== null) {
                    filamentString = `<b>Tool ${keys[f].substring(4, 5)}: </b>` + await returnHistory(historyList.history[i].printHistory.filamentSelection)
                    filamentUsage = returnHistoryUsage(historyList.history[i].printHistory);
                    let validateUsage = Validate.stripHTML(filamentUsage)
                    validateUsage = validateUsage.split(" / ").pop();
                    filamentCost = Calc.returnFilamentCost(historyList.history[i].printHistory.filamentSelection, validateUsage);
                    filamentCostText = `<b>Tool ${keys[f].substring(4, 5)}: </b>`+filamentCost;
                    filamentCostArray.push(parseFloat(filamentCost));
                  } else {
                    filamentString = `<b>Tool ${keys[f].substring(4, 5)}: </b>` + "(No Spool)"
                    filamentUsage = `<b>Tool ${keys[f].substring(4, 5)}: </b>` + History.returnFilamentUsage(historyList.history[i].printHistory)
                  }
                }
              }else{
                if (Array.isArray(historyList.history[i].printHistory.filamentSelection)) {
                  if (historyList.history[i].printHistory.filamentSelection[f] !== null) {
                    filamentString += `<b>Tool ${keys[f].substring(4, 5)}: </b>` + await returnHistory(historyList.history[i].printHistory.filamentSelection[f]) + "<br>"
                  } else {
                    filamentString += `<b>Tool ${keys[f].substring(4, 5)}: </b>` + "(No Spool)" + "<br>"
                  }
                } else {
                  //Old when it isn't an array...
                  if (historyList.history[i].printHistory.filamentSelection !== null) {
                    filamentString = `<b>Tool ${keys[f].substring(4, 5)}: </b>` + await returnHistory(historyList.history[i].printHistory.filamentSelection)
                  } else {
                    filamentString = `<b>Tool ${keys[f].substring(4, 5)}: </b>` + "(No Spool)"
                  }
                }


              }
            }



            let numOr0 = n => isNaN(n) ? 0 : n
            totalCost = filamentCostArray.reduce((a, b) =>
                numOr0(a) + numOr0(b))
            totalCost = totalCost.toFixed(2)
            if(isNaN(totalCost)){
              totalCost = "No printer cost..."
            }
          }


      }

      document.getElementById("totalCost-"+ historyList.history[i]._id).innerHTML = totalCost;
      document.getElementById("cost-" + historyList.history[i]._id).innerHTML = filamentCostText;
      document.getElementById("spool-" + historyList.history[i]._id).innerHTML = filamentString;
      if(Array.isArray(filamentUsage)){
            document.getElementById("usage-" + historyList.history[i]._id).innerHTML = "";
            filamentUsage.forEach(usage => {
              document.getElementById("usage-" + historyList.history[i]._id).insertAdjacentHTML("beforeend", usage);
            })
          }else{
            document.getElementById("usage-" + historyList.history[i]._id).innerHTML = filamentUsage;
          }
      // let filamentString = "";
      // let filamentUsage = null;
      //

      // }else{
      //   if (historyList.history[i].printHistory.filamentSelection !== null && typeof historyList.history[i].printHistory.filamentSelection !== 'undefined' ) {
      //     filamentString = `<b>Tool 0: </b>` + await returnHistory(historyList.history[i].printHistory.filamentSelection)
      //
      //   } else {
      //     filamentString = "None selected..."
      //
      //   }
      // }
      // if (historyList.history[i].printHistory.success) {
      //   document.getElementById("spool-" + historyList.history[i]._id).innerHTML = filamentString;
      //   if(Array.isArray(filamentUsage)){
      //     document.getElementById("usage-" + historyList.history[i]._id).innerHTML = "";
      //     filamentUsage.forEach(usage => {
      //       document.getElementById("usage-" + historyList.history[i]._id).insertAdjacentHTML("beforeend", usage);
      //     })
      //   }else{
      //     document.getElementById("usage-" + historyList.history[i]._id).innerHTML = filamentUsage;
      //   }

        // let grams = document.getElementById("usage-" + historyList.history[i]._id)
        // grams = grams.innerHTML
        // grams = grams.split(" / ").pop();
        // let filamentCost = "";
        //
        // let totalCost = 0;
        // let printerCost = Calc.returnPrintCost(historyList.history[i].printHistory.costSettings, historyList.history[i].printHistory.printTime)
        // if(Array.isArray(historyList.history[i].printHistory.filamentSelection)) {
        //

        // }else{
        //   filamentCost = Calc.returnFilamentCost(historyList.history[i].printHistory.filamentSelection, grams);
        //   filamentCostText = "<b>Tool 0: </b>"+filamentCost;
        // }

      //

      //   document.getElementById("cost-" + historyList.history[i]._id).innerHTML = filamentCostText;
      //
      //   document.getElementById("totalCost-"+ historyList.history[i]._id).innerHTML = totalCost;
      // } else {
      //   document.getElementById("spool-" + historyList.history[i]._id).innerHTML = filamentString;
      //   document.getElementById("cost-" + historyList.history[i]._id).innerHTML = "";
      //
      //   let printerCost = Calc.returnPrintCost(historyList.history[i].printHistory.costSettings, historyList.history[i].printHistory.printTime);
      //   document.getElementById("printerCost-" + historyList.history[i]._id).innerHTML = printerCost;
      //   document.getElementById("totalCost-"+ historyList.history[i]._id).innerHTML = printerCost;
      // }

    }
    jplist.init({
      storage: 'localStorage', //'localStorage', 'sessionStorage' or 'cookies'
      storageName: 'history-sorting' //the same storage name can be used to share storage between multiple pages
    });
    document.getElementById("loading").style.display = "none";
    document.getElementById("wrapper").classList.remove("d-none");
    document.getElementById("historyToolbar").classList.remove("d-none");
  }

  static async edit(e) {
    if (e.target.classList.value.includes("historyEdit")) {
      document.getElementById("historySave").insertAdjacentHTML(
        "afterbegin",
        `
      <button id="historyUpdateCostBtn" type="button" class="btn btn-warning" data-dismiss="modal">
        Update Cost
      </button>
      <button id="historySaveBtn" type="button" class="btn btn-success" data-dismiss="modal">
        Save Changes
      </button>
    `
      );
      document.getElementById("historySaveBtn").addEventListener("click", f => {
        History.save(e.target.id);
      });
      document.getElementById("historyUpdateCostBtn").addEventListener("click", f => {
        History.updateCost(e.target.id);
      });
      //Grab elements
      let printerName = document.getElementById("printerName");
      let fileName = document.getElementById("fileName");
      let status = document.getElementById("printStatus");
      let filament = document.getElementById("filament");

      let startDate = document.getElementById("startDate");
      let printTime = document.getElementById("printTime");
      let endDate = document.getElementById("endDate");

      let volume = document.getElementById("volume");
      let length = document.getElementById("length");
      let weight = document.getElementById("weight");

      let notes = document.getElementById("notes");

      let uploadDate = document.getElementById("dateUploaded");
      let path = document.getElementById("path");
      let size = document.getElementById("size");

      let cost = document.getElementById("cost")
      let printerCost = document.getElementById("printerCost");

      let estimatedPrintTime = document.getElementById("estimatedPrintTime");
      let averagePrintTime = document.getElementById("averagePrintTime");
      let lastPrintTime = document.getElementById("lastPrintTime");

      printerName.innerHTML = " - ";
      fileName.innerHTML = " - ";
      status.innerHTML = " - ";
      filament.innerHTML = " - ";

      startDate.innerHTML = " - ";
      printTime.innerHTML = " - ";
      endDate.innerHTML = " - ";

      volume.value = " - ";
      length.value = " - ";
      weight.value = " - ";

      notes.value = "";
      cost.value = " - ";
      uploadDate.value = " - ";
      path.value = " - ";
      size.value = " - ";

      estimatedPrintTime.value = " - ";
      averagePrintTime.value = " - ";
      lastPrintTime.value = " - ";
      let thumbnail = document.getElementById("history-thumbnail");
      thumbnail.innerHTML = "";
      let index = _.findIndex(historyList.history, function(o) {
        return o._id == e.target.id;
      });
      let current = historyList.history[index].printHistory;
      printerName.innerHTML = current.printerName;
      fileName.innerHTML = current.fileName;
      if(typeof current.thumbnail !== 'undefined' && current.thumbnail != null){
        thumbnail.innerHTML = `<center><img src="data:image/png;base64, ${current.thumbnail}" class="historyImage mb-2"></center>`
      }
      if (current.success) {
        status.innerHTML =
          '<i class="fas fa-thumbs-up text-success fa-3x"></i>';
        if(typeof current.job != 'undefined' && current.job.filament != null) {
          volume.value = Math.round((current.job.filament.tool0.volume / 100) * 100) / 100;
          length.value = Math.round((current.job.filament.tool0.length / 1000) * 100) / 100;

          let filamentWeight = null;
          if (current.filamentSelection !== null) {
            filamentWeight = returnHistoryUsage(current)
          } else {
            filamentWeight = History.returnFilamentUsage(current)
          }
          filamentWeight = filamentWeight.split(" / ").pop()
          weight.value = filamentWeight
          cost.value = Calc.returnFilamentCost(current.filamentSelection, filamentWeight);
          printerCost.value = Calc.returnPrintCost(current.costSettings, current.printTime);


          if (current.job.filament.tool0.length === 0) {
            volume.value = "No statistic generated by OctoPrint";
            length.value = "No statistic generated by OctoPrint";
            weight.value = "No statistic generated by OctoPrint";
            cost.value = "No statistic generated by OctoPrint";
          }
        }
        if (typeof current.job != "undefined") {
          let upDate = new Date(current.job.file.date * 1000);
          upDate =
            upDate.toLocaleDateString() + " " + upDate.toLocaleTimeString();
          uploadDate.value = upDate;
          path.value = current.job.file.path;
          size.value = Calc.bytes(current.job.file.size);

          estimatedPrintTime.value = Calc.generateTime(
            current.job.averagePrintTime
          );
          averagePrintTime.value = Calc.generateTime(
            current.job.estimatedPrintTime
          );
          lastPrintTime.value = Calc.generateTime(current.job.lastPrintTime);
        }
      } else {
        if (current.reason === "cancelled") {
          status.innerHTML =
            '<i class="fas fa-thumbs-down text-warning fa-3x"></i>';
        } else {
          status.innerHTML =
            '<i class="fas fa-exclamation text-danger fa-3x"></i>';
        }
      }
      function SelectHasValue(select, value) {
        let obj = document.getElementById(select);

        if (obj !== null) {
          return (obj.innerHTML.indexOf('value="' + value + '"') > -1);
        } else {
          return false;
        }
      }
      let filamentList = await returnDropDown();
      filamentList.forEach(list => {
        filament.insertAdjacentHTML("beforeend", list)
      })
      if(current.filamentSelection != null){
        if(SelectHasValue(filament, current.filamentSelection._id)){
          filament.value = current.filamentSelection._id;
        }else{
          filament.insertAdjacentHTML("afterbegin", `
            <option value="${current.filamentSelection._id}">${await returnHistory(current.filamentSelection)}</option>
          `)
          filament.value = current.filamentSelection._id;
        }

      }else{
        filament.value = 0;
      }

      startDate.innerHTML = current.startDate;
      printTime.innerHTML = Calc.generateTime(current.printTime);
      endDate.innerHTML = current.endDate;
    }
  }
  static async updateCost(id) {
    let update = {
      id: id
    }
    let post = await OctoFarmClient.post("history/updateCostMatch", update);
    post = await post.json();
    if (post.status === 200) {
      UI.createAlert("success", "Successfully added your printers cost to history.", 3000, "clicked");
      document.getElementById("printerCost-"+id).innerHTML = Calc.returnPrintCost(post.costSettings, post.printTime);
    }else{
      UI.createAlert("warning", "Printer no longer exists in database, default cost applied.", 3000, "clicked");
      document.getElementById("printerCost-"+id).innerHTML = Calc.returnPrintCost(post.costSettings, post.printTime);
    }
  }
  static async save(id) {
    let update = {
      id: id,
      note: document.getElementById("notes").value,
      filamentId: document.getElementById("filament").value
    };

    let post = await OctoFarmClient.post("history/update", update);

    if (post.status === 200) {
      UI.createAlert("success", "Successfully updated your history entry...", 3000, "clicked");
      document.getElementById("note-" + id).innerHTML = update.note;
      document.getElementById("spool-" + id).innerHTML = update.filamentId;
    }
  }
  static async delete(e) {
    if (e.target.classList.value.includes("historyDelete")) {
      bootbox.confirm({
          message: "Are you sure you'd like to delete this entry? this is not reversible.",
          buttons: {
              confirm: {
                  label: 'Yes',
                  className: 'btn-success'
              },
              cancel: {
                  label: 'No',
                  className: 'btn-danger'
              }
          },
          callback: async function (result) {

              let histID = {
                id: e.target.id
              };
              let post = await OctoFarmClient.post("history/delete", histID);
              if (post.status === 200) {
                jplist.resetContent(function(){
                  //remove element with id = el1
                  e.target.parentElement.parentElement.parentElement.remove();
                });
                UI.createAlert(
                    "success",
                    "Your history entry has been deleted...",
                    3000,
                    "clicked"
                );
              } else {
                UI.createAlert(
                    "error",
                    "Hmmmm seems we couldn't contact the server to delete... is it online?",
                    3000,
                    "clicked"
                );
              }
            }

      });
    }
  }
  static updateTotals(filtered) {
    let times = []
    let cost = [];
    let printerCost = [];
    let usageG = [];
    let usageL = [];
    let statesCancelled = [];
    let statesFailed = [];
    let statesSuccess = [];
      filtered.forEach(row => {
        times.push(parseInt(row.getElementsByClassName("time")[0].innerText))
        if(!isNaN(parseFloat(row.getElementsByClassName("cost")[0].innerText))){
          cost.push(parseFloat(row.getElementsByClassName("cost")[0].innerText))
        }
        if(!isNaN(parseFloat(row.getElementsByClassName("printerCost")[0].innerText))){
          printerCost.push(parseFloat(row.getElementsByClassName("printerCost")[0].innerText))
        }
        let stateText = row.getElementsByClassName("stateText")[0].innerText.trim();
        if(stateText === "Cancelled"){
          statesCancelled.push(stateText)
        }
        if(stateText === "Failure"){
          statesFailed.push(stateText)
        }
        if(stateText === "Success"){
          statesSuccess.push(stateText)
        }
        if(row.getElementsByClassName("usage")[0].innerText !== ""){
          let split = row.getElementsByClassName("usage")[0].innerText.split("/")
          usageL.push(parseFloat(split[0]))
          usageG.push(parseFloat(split[1]))
        }

      })
    let total = statesCancelled.length + statesFailed.length + statesSuccess.length;
    let cancelledPercent = (statesCancelled.length / total) * 100;
    let failurePercent = (statesFailed.length / total) * 100;
    let successPercent = (statesSuccess.length / total) * 100;
    let failure = document.getElementById("totalFailurePercent")
    failure.style.width = failurePercent.toFixed(2)+"%";
    failure.innerHTML = failurePercent.toFixed(2)+"%";
    let success = document.getElementById("totalSuccessPercent")
    success.style.width = successPercent.toFixed(2)+"%";
    success.innerHTML = successPercent.toFixed(2)+"%";
    let cancelled = document.getElementById("totalCancelledPercent")
    cancelled.style.width = cancelledPercent.toFixed(2)+"%";
    cancelled.innerHTML = cancelledPercent.toFixed(2)+"%";
    document.getElementById("totalCost").innerHTML = cost.reduce((a, b) => a + b, 0).toFixed(2)
    document.getElementById("totalFilament").innerHTML = usageL.reduce((a, b) => a + b, 0).toFixed(2) + "m / " + usageG.reduce((a, b) => a + b, 0).toFixed(2)+ "g"
    let totalTimes = times.reduce((a, b) => a + b, 0)
    document.getElementById("totalPrintTime").innerHTML = Calc.generateTime(totalTimes)
    document.getElementById("printerTotalCost").innerHTML = printerCost.reduce((a, b) => a + b, 0).toFixed(2);
    document.getElementById("combinedTotalCost").innerHTML = (parseFloat(printerCost.reduce((a, b) => a + b, 0).toFixed(2)) + parseFloat(cost.reduce((a, b) => a + b, 0).toFixed(2))).toFixed(2);
  }
}
const element = document.getElementById('listenerHistory');
element.addEventListener('jplist.state', (e) => {
  //the elements list after filtering + pagination
  History.updateTotals(e.jplistState.filtered);
}, false);
History.get();
