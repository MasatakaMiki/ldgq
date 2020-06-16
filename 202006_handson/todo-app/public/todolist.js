window.onload = async function() {
    const useNodeJS = true;   // if you are not using a node server, set this value to false
    const defaultLiffId = "";   // change the default LIFF value if you are not using a node server
    // DO NOT CHANGE THIS
    let myLiffId = "";

    let promise = new Promise((resolve, reject) => {
        // if node is used, fetch the environment variable and pass it to the LIFF method
        // otherwise, pass defaultLiffId
        if (useNodeJS) {
            fetch('/send-id')
                .then(function(reqResponse) {
                return reqResponse.json();
            })
            .then(function(jsonResponse) {
                myLiffId = jsonResponse.id;
                resolve('get my liff id');
            })
            .catch(function(error) {
                document.getElementById("liffAppContent").classList.add('hidden');
                document.getElementById("nodeLiffIdErrorMessage").classList.remove('hidden');
                reject('cannot get my liff id');
            });
        } else {
            myLiffId = defaultLiffId;
            resolve('get my liff id');
        }
    });

    let result = await promise;

    if (!myLiffId)
    {
        document.getElementById("liffAppContent").classList.add('hidden');
        document.getElementById("nodeLiffIdErrorMessage").classList.remove('hidden');
    } else {
      liff
          .init({
              liffId: myLiffId
          })
          .then(() => {
              // start to use LIFF's api
              initializeApp();
          })
          .then(() => {
              // init後でないとprofileは取得できない
              getTodoList();
          })
          .catch((err) => {
              document.getElementById("liffAppContent").classList.add('hidden');
              document.getElementById("liffInitErrorMessage").classList.remove('hidden');
          });
    }
};

/**
 * Initialize the app by calling functions handling individual app components
 */
function initializeApp() {
    displayIsInClientInfo();
    registerButtonHandlers();

    // check if the user is logged in/out, and disable inappropriate button
    if (liff.isLoggedIn()) {
        document.getElementById('liffLoginButton').disabled = true;
    } else {
        document.getElementById('liffLogoutButton').disabled = true;
    }
}

/**
* Toggle the login/logout buttons based on the isInClient status, and display a message accordingly
*/
function displayIsInClientInfo() {
    if (liff.isInClient()) {
        document.getElementById('liffLoginButton').classList.toggle('hidden');
        document.getElementById('liffLogoutButton').classList.toggle('hidden');
        document.getElementById('isInClientMessage').textContent = 'You are opening the app in the in-app browser of LINE.';
    } else {
        document.getElementById('isInClientMessage').textContent = 'You are opening the app in an external browser.';
    }
}

/**
* Register event handlers for the buttons displayed in the app
*/
function registerButtonHandlers() {
    // login call, only when external browser is used
    document.getElementById('liffLoginButton').addEventListener('click', function() {
        if (!liff.isLoggedIn()) {
            // set `redirectUri` to redirect the user to a URL other than the front page of your LIFF app.
            liff.login();
        }
    });

    // logout call only when external browse
    document.getElementById('liffLogoutButton').addEventListener('click', function() {
        if (liff.isLoggedIn()) {
            liff.logout();
            window.location.reload();
        }
    });
}

/**
* Alert the user if LIFF is opened in an external browser and unavailable buttons are tapped
*/
function sendAlertIfNotInClient() {
    alert('This button is unavailable as LIFF is currently being opened in an external browser.');
}

function getTodoList() {
  let userid = "hoge";
  liff.getProfile().then(function(profile) {
      document.getElementById('displayNameField').innerText = profile.displayName + ' のやることリスト';
      userid = profile.userId;
      document.getElementById('hidden_userid').value = userid;

      fetch('/get-list?userid=' + userid)
          .then(function(reqResponse) {
              return reqResponse.json();
          })
          .then(function(jsonResponse) {
              //console.log(jsonResponse);

              // ulに表示するli(checkboxとlabel)を作成
              const ul_todo = document.getElementById("ul_todo");
              const ul_done = document.getElementById("ul_done");
              ul_todo.innerHTML = '';
              ul_done.innerHTML = '';
              for (var index in jsonResponse.datas) {
                  let li = document.createElement("li");
                  let chk = document.createElement("input")
                  chk.setAttribute('type', 'checkbox');
                  chk.setAttribute('id', 'chk_' + jsonResponse.datas[index].id);
                  if (jsonResponse.datas[index].status == 0) {
                      chk.setAttribute('onclick', 'completeTask(event, ' + jsonResponse.datas[index].id + ', \'' + jsonResponse.datas[index].task + '\')');
                  } else {
                      chk.setAttribute('onclick', 'removeTask(event, ' + jsonResponse.datas[index].id + ', \'' + jsonResponse.datas[index].task + '\')');
                  }
                  let lbl = document.createElement("label");
                  lbl.setAttribute('for', 'chk_' + jsonResponse.datas[index].id);
                  lbl.appendChild(document.createTextNode(jsonResponse.datas[index].task));
                  li.appendChild(chk);
                  li.appendChild(lbl);
                  if (jsonResponse.datas[index].status == 0) {
                    ul_todo.appendChild(li);
                  } else {
                    ul_done.appendChild(li);
                  }
              }
          })
          .catch(function(error) {
              document.getElementById("liffAppContent").classList.add('hidden');
              document.getElementById("nodeLiffIdErrorMessage").classList.remove('hidden');
          });
  }).catch(function(error) {
      window.alert('ログインしてください！');
  });
}

function completeTask(_e, _id, _task) {
    let result = window.confirm(_task + ' やった？');
    if (result) {
        const id = _id;
        const hidden_userid = document.getElementById('hidden_userid').value;
        fetch("/complete-task",
            { method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ id, hidden_userid })
            })
            .then(function(reqResponse) {
                return reqResponse.json();
            })
            .then(function(jsonResponse) {
                console.log(jsonResponse);
                if (jsonResponse.message) {
                    // Error
                    throw new Error(jsonResponse.message);
                }
                if (!liff.isInClient()) {
                    // ブラウザからはliff.sendMessageは使えない
                    //sendAlertIfNotInClient();

                    const hidden_userid = document.getElementById('hidden_userid').value;
                    const message = _task + " をやりました\n" + jsonResponse.updated;
                    fetch("/send-message",
                        { method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({ hidden_userid, message })
                        })
                        .then(function(reqResponse) {
                            return reqResponse.json();
                        })
                        .then(function(jsonResponse) {
                            console.log(jsonResponse);
                            if (jsonResponse.message) {
                                // Error
                                throw new Error(jsonResponse.message);
                            }
                            getTodoList();
                            //window.location.reload();
                        })
                        .catch(function(error) {
                            window.alert('Error sending a message: ' + error);
                        });

                } else {
                    liff.sendMessages([{
                        'type': 'text',
                        'text': _task + " をやりました\n" + jsonResponse.updated
                    }]).then(function() {
                        //window.alert('Message sent');
                        getTodoList();
                        //window.location.reload();
                    }).catch(function(error) {
                        window.alert('Error sending message: ' + error);
                    });
                }
            })
            .catch(function(error) {
                window.alert('Error updating task: ' + error);
            });
    } else {
        _e.preventDefault();
    }
}

function removeTask(_e, _id, _task) {
    let result = window.confirm(_task + ' やったことリストから削除する？');
    if (result) {
        const id = _id;
        const hidden_userid = document.getElementById('hidden_userid').value;
        fetch("/remove-task",
            { method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ id, hidden_userid })
            })
            .then(function(reqResponse) {
                return reqResponse.json();
            })
            .then(function(jsonResponse) {
                console.log(jsonResponse);
                if (jsonResponse.message) {
                    // Error
                    throw new Error(jsonResponse.message);
                }
                //window.location.reload();
                getTodoList();
            })
            .catch(function(error) {
                window.alert('Error deleting task: ' + error);
            });
    } else {
        _e.preventDefault();
    }
}
