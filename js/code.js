// get exported json from cytoscape desktop via ajax

var address = "0xb3764761e297d6f121e79c32a65829cd1ddb4d32";

$(function(){

  function getTransaction(address, callback){
    $.ajax({
      url: 'http://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&sort=asc', // transactions
      type: 'GET',
      dataType: 'json',
      success: callback
    });
  }

  var ether =  1000000000000000000;
  var depth =  3;
  var maxOut = 50;
  var nodes = [];
  var edges = [];
  var accounts = [];
  var exchanges = ['0x57b174839cbd0a503b9dfcb655e4f4b1b47b3296', '0x70faa28a6b8d6829a4b1e649d26ec9a2a39ba413', '0x96fc4553a00c117c5b0bed950dd625d1c16dc894'];


  function walkOne(address, callback){
    getTransaction(address, function(result){
      var newQueue = [];
      transactions = result['result'];
      var out = 0;
      for(var j=0; j < transactions.length; j++){
        if(transactions[j].isError == 1){
          continue;
        }
        if(transactions[j].from === address){
          if(transactions[j].value > ether){
            out++;
            if(out > maxOut) break;
          }
        }
      }
      if(out > maxOut){
        exchanges.push(transactions[j].from);
        edges.push({data: {id: address, weight: 0, label: "exchange", source: transactions[j].from, target: transactions[j].from}});
        callback(newQueue);
      } else {
        for(var j=0; j < transactions.length; j++){
          if(transactions[j].from === address){
            if(transactions[j].isError == 1){
              continue;
            }
            if (newQueue.indexOf(transactions[j].to) < 0) {
              if(transactions[j].value > ether){
                if(exchanges.indexOf(transactions[j].to) < 0){
                  newQueue.push(transactions[j].to);
                  nodes.push({data: { id: transactions[j].to, name: transactions[j].to}});
                }else{
                  nodes.push({data: { id: transactions[j].to, name: transactions[j].to}});
                  edges.push({data: {id: transactions[j].hash, weight: transactions[j].value/ether, label: 'exchange: '  + transactions[j].value/ether, source: transactions[j].from, target: transactions[j].to}});
                }
                if(accounts.indexOf(transactions[j].to) < 0){
                  accounts.push(transactions[j].to);
                }
              }
            }

            if(transactions[j].value > ether){
              if(exchanges.indexOf(transactions[j].to) >= 0){
                edges.push({data: {id: transactions[j].hash, weight: transactions[j].value/ether, label: 'exchange: '  + transactions[j].value/ether, source: transactions[j].from, target: transactions[j].to}});
              }else{
                edges.push({data: {id: transactions[j].hash, weight: transactions[j].value/ether, label: transactions[j].value/ether, source: transactions[j].from, target: transactions[j].to}});
              }
            }
          }
        }
        callback(newQueue);
      }
    });
  }


  function walkQueue(queue, depth, callback){
    for(var i = 0; i < queue.length; i++){
      walkOne(queue[i], function(newQueue){
        if(depth > 0 && newQueue.length > 0) {
          callback(newQueue, depth, callback);
        }
      });
    }
  }

  function walkAll(address, depth, _callback){
    address = address.toLowerCase();
    nodes.push({data: { id: address, name: address}});
    var queue = [address];
    walkQueue(queue, depth, function(newQueue, depth, callback){
      depth--;
      if(depth > 0 && newQueue.length > 0){
        walkQueue(newQueue, depth, callback);
      }
        _callback();
        console.log(accounts);
    });

  }

  walkAll(address, depth, initCy);

  // when both graph export json and style loaded, init cy

  function initCy(){
    var cy = cytoscape({
      container: document.querySelector('#cy'),

      boxSelectionEnabled: false,
      autounselectify: true,

      style: cytoscape.stylesheet()
          .selector('node')
          .css({
            'content': 'data(name)',
            'text-valign': 'center',
            'color': '#333',
            'text-outline-color': '#999'
          })
          .selector('edge')
          .css({
            'label': "data(label)",
            'edge-text-rotation': "autorotate",
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#ccc',
            'line-color': '#ccc',
            'width': 2
          })
          .selector(':selected')
          .css({
            'background-color': 'black',
            'line-color': 'black',
            'target-arrow-color': 'black',
            'source-arrow-color': 'black'
          })
          .selector('.faded')
          .css({
            'opacity': 0.25,
            'text-opacity': 0
          }),

      elements: {
        nodes: nodes,
        edges: edges
      },

      layout: {
        name: 'grid',
        padding: 10
      }
    });

    cy.on('tap', 'node', function(e){
      var node = e.cyTarget;
      var neighborhood = node.neighborhood().add(node);

      cy.elements().addClass('faded');
      neighborhood.removeClass('faded');
    });

    cy.on('tap', function(e){
      if( e.cyTarget === cy ){
        cy.elements().removeClass('faded');
      }
    });

    var cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      layout: { name: 'preset' },
      style: styleJson,
      elements: elements,
      motionBlur: true,
      selectionType: 'single',
      boxSelectionEnabled: false
    });

  }

});



