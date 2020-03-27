$( function() {

  var vendorType          = 'hp',
  multiAddRunning         = 0,
  disk_type               = $( "#disk_type" ),
  capacity                = $( "#capacity" ),
  serial                  = $( "#serial" ),
  diskSpeedSelector       = $('#configuratorMain #diskSpeed label'),
  diskTypeSelector        = $('#configuratorMain #diskType label'),
  interfaceTypeSelector   = $('#configuratorMain #interfaceType label'),
  interfaceSpeedSelector  = $('#configuratorMain #interfaceSpeed label'),
  formFactorSelector      = $('#configuratorMain #formFactor label');
  genSelector             = $('#configuratorMain #gen label');

  var objectsToReset = [
    { object: diskSpeedSelector, defaultField: '7.2K' },
    { object: diskTypeSelector, defaultField: 'SATA' },
    { object: interfaceTypeSelector, defaultField: 'singlePort' },
    { object: interfaceSpeedSelector, defaultField: 'SATA2/SAS' },
    { object: formFactorSelector, defaultField: 'SFF' },
    { object: genSelector, defaultField: 'gen5' }
  ];

  createFormatTool();
  initApp();
  generateExample();

  /* Main Functions */

  function initApp() {
    $('#printOutContainer').hide();

    $('#configuratorMain').validator().on('submit', function (e) {
      if (e.isDefaultPrevented()) {
        $(this).validator('validate');
        console.warn ('Validation failed, the user should re-check the fields before resubmitting');
      } else {
        addUser();
      }
    });

    $( "#addNewDisk" ).button().on( "click", function() {
      $('#configuratorMain').submit();
    });

    $( "#btnPrintPage" ).button().on( "click", function() {
      preparePrint();
      window.print();
    });

    $( "#btnRestartApp" ).button().on( "click", function() {
      resetPage();
    });

    $('table#vendors img').click(function(e) {
      $('#vendorPicker').modal('hide');
      console.info($(this).attr('id') + ' Clicked!');
      vendorType = $(this).attr('id');
      if (vendorType === 'dell') {
        disableSelector(interfaceTypeSelector);
        disableSelector(interfaceSpeedSelector);
        disableSelector(genSelector);
        serial.attr('disabled',true).removeAttr('required').attr('placeholder','Not Applicable').val('');
        ['SASMDL', 'SATAMDL', 'FC', 'SSNW'].forEach( function(s) {
          disableSelectorOption(diskTypeSelector, s);
        });
      }
      if (vendorType === 'sm') {
        disableSelector(interfaceTypeSelector);
        disableSelector(interfaceSpeedSelector);
        disableSelector(diskSpeedSelector);
        disableSelector(genSelector);
        serial.attr('disabled',true).removeAttr('required').attr('placeholder','Not Applicable').val('');
        ['SASMDL', 'SATAMDL', 'FC', 'SSNW'].forEach( function(s) {
          disableSelectorOption(diskTypeSelector, s);
        });
      }
      $('#configuratorMain').modal('show');
      $('#configuratorMain').validator('validate');
    });


    $('#configuratorMain').on('hidden.bs.modal', function () {
      resetConfigurator();
    });

    $('#gen label').on('change', function (){
      var gen = $('#gen input:radio:checked').parent().text().trim();

      console.log (gen);
      if (gen !== '5/6/7') {
        console.info ('Gen' + gen + ' is selected disable unused options');
        disableSelector(interfaceTypeSelector);
        disableSelector(interfaceSpeedSelector);
        //disableSelectorOption(interfaceSpeedSelector, 'SASMDL');
        ['SASMDL', 'SATAMDL', 'FC', 'SSNW'].forEach( function(s) {
          disableSelectorOption(diskTypeSelector, s);
        });
      } else { 
          console.info ('Gen' + gen + ' is selected enable disabled options');
          if (vendorType !== 'dell' && vendorType !== 'sm') {
              ['SASMDL', 'SATAMDL', 'FC', 'SSNW'].forEach( function(s) {
                enableSelectorOption(diskTypeSelector, s);
              });
          }
          if (isSelectorDisabled(interfaceTypeSelector)) {
            enableSelector(interfaceTypeSelector);
          }
          if (isSelectorDisabled(interfaceSpeedSelector)) {
            enableSelector(interfaceSpeedSelector);
          }
      }
    });

    $('#diskType label').on('change', function (){
      var diskType = $('#diskType input:radio:checked').parent().text().trim();
      var gen = $('#gen input:radio:checked').parent().text().trim();
      console.info('Gen ' + gen + ' selected, exiting diskType change')
      if (gen !== '5/6/7') return;

      console.log (diskType);
      if (/SSD/gi.test(diskType)) {
        console.info ('SSD is selected disable the disk speed option.');
        disableSelector(diskSpeedSelector);
      } else if (isSelectorDisabled(diskSpeedSelector) && vendorType !== 'sm' ) {
        enableSelector(diskSpeedSelector);
      }

      if (/SAS/gi.test(diskType)) {
        console.info ('SAS Disk selected disable the 1.5 Gbps speed option.');
        disableSelectorOption(interfaceSpeedSelector, 'SATA1');
      } else if ( isSelectorOptionDisabled(interfaceSpeedSelector, 'SATA1') && vendorType !== 'dell' && vendorType !== 'sm' ) {
        enableSelectorOption(interfaceSpeedSelector, 'SATA1');
      }

      if (/(SATA|SSD)/gi.test(diskType)) {
        console.info ('SATA Disk selected disable controller speeds faster than SATAIII.');
        disableSelectorOption(interfaceSpeedSelector, 'SAS3');
        disableSelectorOption(interfaceSpeedSelector, 'SAS4');
      } else if ( ( isSelectorOptionDisabled(interfaceSpeedSelector, 'SAS3') || isSelectorOptionDisabled(interfaceSpeedSelector, 'SAS4') ) && vendorType !== 'dell' && vendorType !== 'sm') {
        enableSelectorOption(interfaceSpeedSelector, 'SAS3');
        enableSelectorOption(interfaceSpeedSelector, 'SAS4');
      }
    });
  }

  function hpTypeToColor(gen,type,speed,obj) {
    diskSpeedObj = obj.find('.speed');
    diskTypeObj  = obj.find('.interface');
    labelDivider = obj.find('.divider');

    if (gen == "gen5" ) {
        console.info ('HP gen 5/6/7 label colours');
        switch (true) {
          case /^SAS$/gi.test(type):
            labelDivider.addClass('hpPurple'); break;
          case /^(SAS MDL|SATA|SATA MDL)$/gi.test(type):
            labelDivider.addClass('hpCyan'); break;
          case /^Fibre Channel$/gi.test(type):
            labelDivider.addClass('hpOrange'); break;
          case /^SSD$/gi.test(type):
            labelDivider.addClass('hpWhite'); break;
          case /SSNW/gi.test(type):
            labelDivider.addClass('hpSSNW'); break;
        }
    }
    else if (gen == "gen8" ) {
        console.info ('HP gen 8/9 label colours');
        //no colours
    }

    if ( !/(DP|Dual|Dual Port)/.test(speed)) {
      console.info ('This is a non DP Disk (' + type + ')');

      diskSpeedObj.addClass('nonDP');
    }

    if (/SSD/.test(type) && vendorType !== 'dell' && vendorType !== 'sm') { diskTypeObj.text(String.fromCharCode(160)); }

  }

  function addUser(e, formFactor, interfaceType, interfaceSpeed, diskSpeed, diskType, diskCapacity, diskSerial, targetTable, targetNumber, gen ) {
    diskSpeedLabel = '';
    diskSpeedDell  = '';
    diskSpeedSM    = '';

    formFactor      = formFactor      === undefined ? $('#formFactor label.active').attr('for')     : formFactor;
    interfaceType   = interfaceType   === undefined ? $('#interfaceType label.active').attr('for')  : interfaceType;
    interfaceSpeed  = interfaceSpeed  === undefined ? $('#interfaceSpeed label.active').attr('for') : interfaceSpeed;
    diskSpeed       = diskSpeed       === undefined ? $('#diskSpeed label.active').attr('for')      : diskSpeed;
    diskType        = diskType        === undefined ? $('#diskType label.active').text().trim()     : diskType;
    diskCapacity    = diskCapacity    === undefined ? capacity.val()                                : diskCapacity;
    diskSerial      = diskSerial      === undefined ? serial.val()                                  : diskSerial;
    targetTable     = targetTable     === undefined ? 'printOutTable'                               : targetTable;
    targetNumber    = targetNumber    === undefined ? 8                                             : targetNumber;
    gen             = gen             === undefined ? $('#gen label.active').attr('for')            : gen;

    console.info ('FF: ' + formFactor + ' -- Gen: ' + gen + ' -- IF: ' + interfaceType + ' -- IFS: ' + interfaceSpeed + ' -- DSp: ' + diskSpeed + ' -- DT: ' + diskType + ' -- DC: ' + diskCapacity + ' -- DSe: ' + diskSpeed + ' -- TT: ' + targetTable + ' -- TN: ' + targetNumber);

    if ( targetTable === 'printOutTable' ) {
      console.log ('WTF');
      $('#printOutContainer').show();
      $('#exampleContainer').hide();
    }

    if (gen !== 'gen8' ) {
      switch (interfaceSpeed) {
        case 'SATA2/SAS':
          if (/SATA/.test(diskType)){
            diskSpeedLabel = diskSpeedLabel.concat('3G ');
          }
          break;
        case 'SATA3/SAS2':
          diskSpeedLabel = diskSpeedLabel.concat('6G '); break;
        case 'SAS3':
          diskSpeedLabel = diskSpeedLabel.concat('12G '); break;
        case 'SAS4':
          diskSpeedLabel = diskSpeedLabel.concat('22G '); break;
      }

      if (interfaceType === 'dualPort') {
        if (diskSpeedLabel === '') {
          diskSpeedLabel = diskSpeedLabel.concat('Dual Port ');
        } else {
          diskSpeedLabel = diskSpeedLabel.concat('DP ');
        }
      }
    }

    if (diskSpeed) {
      diskSpeedLabel = diskSpeedLabel.concat(diskSpeed);
      diskSpeedDell  = diskSpeedDell.concat(diskSpeed);
      diskSpeedSM  = diskSpeedSM.concat(diskSpeed);
    }

    if (/(SSD|SSNW)/i.test(diskType)) {
      if (gen === 'gen8') {
        diskSpeedLabel = 'SSD';
	diskType = 'SATA';
      }
      else {
        diskSpeedLabel = 'SATA SSD';
      }
    }

    var valid = true;

    switch (vendorType) {
      case 'hp':
        console.info ('Disk Speed HP Label : ' + diskSpeedLabel);
        switch (gen) {
          case 'gen5':
            console.info ('HP: gen 5/6/7 label');
            switch (formFactor) {
              case 'SFF':
                labelString = "<div class='hp SFF'><div class='speed'>{0}</div><div class='interface divider'>{1}</div><div class='capacity'>{2}</div><div class='serial'>{3}</div></div>".format(diskSpeedLabel,diskType,diskCapacity,diskSerial);
                break;
              case 'LFF':
                labelString = "<div class='hp LFF'><div class='speed'>{0}</div><div class='interface'>{1}</div><hr class='divider'/><div class='capacity'>{2}</div><div class='serial'>{3}</div></div>".format(diskSpeedLabel,diskType,diskCapacity,diskSerial);
                break;
          }
          break;
          case 'gen8':
            console.info ('HP: gen 8/9 label');
            switch (formFactor) {
              case 'SFF':
                labelString = "<div class='hpGen8 SFF'><div class='speed'>{0}</div><div class='divider'></div><div class='interface'>{1}</div><div class='capacity'>{2}</div><div class='divider'></div><div class='serial'>{3}</div></div>".format(diskSpeedLabel,diskType,diskCapacity,diskSerial);
                break;
              case 'LFF':
                labelString ="<div class='hpGen8 LFF'><div class='speed'>{0}</div><div class='divider'></div><div class='interface'>{1}</div><div class='capacity'>{2}</div><div class='divider'></div><div class='serial'>{3}</div></div>".format(diskSpeedLabel,diskType,diskCapacity,diskSerial); 
                break;
          }
          break;
        }
      break;
      case 'dell':
        console.info ('Disk Speed Dell Label : ' + diskSpeedDell);
        switch (formFactor) {
          case 'SFF':
            labelString = "<div class='dell SFF'><div class='interface'>{0}</div><div class='capacity speed'>{1} {2}</div></div>".format(diskType,diskCapacity,diskSpeedDell);
            break;
          case 'LFF':
            labelString = "<div class='dell LFF'><div class='interface'>{0}</div><div class='capacity'>{1}</div><div class='speed'>{2}</div></div>".format(diskType,diskCapacity,diskSpeedDell);
            break;
	  }
      break;
      case 'sm':
        console.info ('Disk Speed SM Label : ' + diskSpeedSM);
        switch (formFactor) {
          case 'SFF':
            labelString = "<div class='sm SFF'><div class='interface'>{0}</div><div class='interface'>{1}</div></div>".format(diskType,diskCapacity);
          break;
          case 'LFF':
            labelString = "<div class='sm LFF'><div class='interface'>{0} | {1}</div></div>".format(diskType,diskCapacity);
          break;
        }
      break;
    }

    if (($('#' + targetTable + ' tr').length === 0) || $('#' + targetTable + ' tr:last td').length >= targetNumber) { $( '#' + targetTable + ' tbody' ).append( '<tr>' ); }
    $( '#' + targetTable + ' tbody tr:last' ).append('<td>' + labelString + '</td>');
    if (($('#' + targetTable + 'tr').length === 0) || $('#' + targetTable + ' tr:last td').length >= targetNumber) { $( '#' + targetTable + ' tbody' ).append( '</tr>' ); }

    hpTypeToColor(gen,diskType,diskSpeedLabel,$( '#' + targetTable + ' tbody tr td' ).last());

    /* Dell SSD fix */
    if (/SSD/i.test(diskType) && vendorType === 'dell' && formFactor === 'LFF') {
      console.info ('Dell SSD Fix');
      $('#' + targetTable + ' td .dell.LFF .speed').last().remove();
      $('#' + targetTable + ' td .dell.LFF .capacity').last().css({'line-height': '0.8cm'})
    }

    if ($('#multiplier').val() > 0 && multiAddRunning !== 1) {
      var multi = $('#multiplier').val();
      $('#multiplier').val('');
      multiAddRunning = 1;

      for (var i = multi - 1 ; i > 0; i--) {
        addUser();
      }
      multiAddRunning = 0;
    }

    if($('#addMore:checked').length === 0) {
      $('#configuratorMain').modal('hide');
    }
  }

  function resetPage() {
    $( "#btnPrintPage" ).show();
    $( "#btnStartConfigurator" ).show();
    $( '#exampleContainer').show();
    $( '#instruction').show();
    $( '#topContainer').show();
    $( 'footer' ).show();
    $( '#printOutTable tbody').html('').parent().parent().hide();
    $(this);
  }

  function resetConfigurator() {
    for (field in objectsToReset) {
      disableSelector(objectsToReset[field].object);
      enableSelector(objectsToReset[field].object,objectsToReset[field].defaultField);
    }
    disableSelectorOption(interfaceSpeedSelector, 'SAS3');
    disableSelectorOption(interfaceSpeedSelector, 'SAS4');
    serial.removeAttr('disabled').attr('required',true).attr('placeholder','SPARE 123456-789').val('');
    $('#multiplier').val('');
    capacity.val('');
    serial.val('');
    multiAddRunning = 0;
  }

  function disableSelector (selector) {
    selector.parent().find('.active').removeClass('active').addClass('wasActive');
    selector.addClass('disabled').attr('aria-disabled', true).css( 'pointer-events', 'none' );
  }

  function enableSelector (selector,field) {
    if ( field !== undefined ) {
      console.log('kurva anyad')
      selector.parent().find('[for=\'' + field + '\']').addClass('active').removeClass('wasActive');
    } else {
      selector.parent().find('.wasActive').addClass('active').removeClass('wasActive');
    }
    selector.removeClass('disabled').attr('aria-disabled', false).css( 'pointer-events', 'auto' );
  }

  function isSelectorDisabled (selector) {
    if (selector.hasClass('disabled')) {
      return true;
    } else {
      return false;
    }
  }

  function disableSelectorOption (selector, label) {
    var selectorOption = selector.parent().find('label[for=\'' + label + '\']');

    selectorOption.addClass('disabled').attr('aria-disabled', true).css( 'pointer-events', 'none' );
    if (selectorOption.hasClass('active')) {
      selector.parent().find('label:not(.disabled)').first().click();
    }
  }

  function enableSelectorOption (selector, label) {
    selector.parent().find('label[for=\'' + label + '\']').removeClass('disabled').attr('aria-disabled', false).css( 'pointer-events', 'auto' );
  }

  function isSelectorOptionDisabled (selector, label) {
    if (selector.parent().find('label[for=\'' + label + '\']').hasClass('disabled')) {
      return true;
    } else {
      return false;
    }
  }

  function preparePrint() {
    $( '#btnPrintPage' ).hide();
    $( '#btnStartConfigurator' ).hide();
    $( '#exampleContainer' ).hide();
    $( '#instruction' ).hide();
    $( '#btnRestartApp' ).hide();
    $( '#topContainer' ).hide();
    $( 'footer' ).hide();
    setTimeout(function() {
      $( '#btnRestartApp').show().click();
    },100);
  }

  function generateExample() {
    examples = {
      hpGen8SFF: {
        title: 'HP G8/9 2.5" (SFF)',
	    vendorType: 'hp',
	    fields: [
          {gen: 'gen8', formFactor: 'SFF', diskSpeed: '7.2K', diskType: 'SATA', diskCapacity: '300 GB', diskSerial: '123456'},
          {gen: 'gen8', formFactor: 'SFF', diskSpeed: '10K', diskType: 'SAS', diskCapacity: '500 GB', diskSerial: '123456'},
          {gen: 'gen8', formFactor: 'SFF', diskSpeed: '15k', diskType: 'SAS', diskCapacity: '1 TB', diskSerial: '123456'},
          {gen: 'gen8', formFactor: 'SFF', diskSpeed: 'SSD', diskType: 'SATA', diskCapacity: '256 GB', diskSerial: '123456'},
          {gen: 'gen8', formFactor: 'SFF', diskSpeed: '7.2K', diskType: 'SATA', diskCapacity: '2 TB', diskSerial: '123456'},
          {gen: 'gen8', formFactor: 'SFF', diskSpeed: '10K', diskType: 'SAS', diskCapacity: '900 GB', diskSerial: '123456'}
        ]
      },
      hpGen8LFF: {
        title: 'HP G8/9 3.5" (LFF)',
        vendorType: 'hp',
        fields: [
         {gen: 'gen8', formFactor: 'LFF', diskSpeed: '7.2K', diskType: 'SATA', diskCapacity: '300 GB', diskSerial: '123456'},
         {gen: 'gen8', formFactor: 'LFF', diskSpeed: '10K', diskType: 'SAS', diskCapacity: '500 GB', diskSerial: '123456'},
         {gen: 'gen8', formFactor: 'LFF', diskSpeed: '15k', diskType: 'SAS', diskCapacity: '1 TB', diskSerial: '123456'},
         {gen: 'gen8', formFactor: 'LFF', diskSpeed: 'SSD', diskType: 'SATA', diskCapacity: '256 GB', diskSerial: '123456'},
         {gen: 'gen8', formFactor: 'LFF', diskSpeed: '7.2K', diskType: 'SATA', diskCapacity: '2 TB', diskSerial: '123456'},
         {gen: 'gen8', formFactor: 'LFF', diskSpeed: '10K', diskType: 'SAS', diskCapacity: '900 GB', diskSerial: '123456'}
        ]
      },
      hpSFF: {
        title: 'HP G5/6/7 2.5" (SFF)',
        vendorType: 'hp',
        fields: [
          {formFactor: 'SFF', interfaceType: 'dualPort', interfaceSpeed: 'SATA2/SAS', diskSpeed: '15K', diskType: 'SAS', diskCapacity: '146 GB', diskSerial: 'SPARE 512744-001'},
          {formFactor: 'SFF', interfaceType: 'dualPort', interfaceSpeed: 'SATA3/SAS2', diskSpeed: '7.2K', diskType: 'SAS MDL', diskCapacity: '500 GB', diskSerial: 'SPARE 508009-001'},
          {formFactor: 'SFF', interfaceType: 'singlePort', interfaceSpeed: 'SATA3/SAS2', diskSpeed: '7.2K', diskType: 'SATA', diskCapacity: '1 TB', diskSerial: 'SPARE 123456-789'},
          {formFactor: 'SFF', interfaceType: 'singlePort', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD', diskCapacity: '400 GB', diskSerial: 'SPARE 690811-002'},
          {formFactor: 'SFF', interfaceType: 'dualPort', interfaceSpeed: 'SATA2/SAS', diskSpeed: '15K', diskType: 'Fibre Channel', diskCapacity: '1 TB', diskSerial: 'SPARE 123456-789'},
          {formFactor: 'SFF', interfaceType: 'singlePort', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD SSNW', diskCapacity: '1 TB', diskSerial: 'SPARE 123456-789'},
        ]
      },
      hpLFF: {
        title: 'HP G5/6/7 3.5" (LFF)',
        vendorType: 'hp',
        fields: [
          {formFactor: 'LFF', interfaceType: 'dualPort', interfaceSpeed: 'SATA2/SAS', diskSpeed: '15K', diskType: 'SAS', diskCapacity: '1 TB', diskSerial: 'SPARE 123456-789'},
          {formFactor: 'LFF', interfaceType: 'dualPort', interfaceSpeed: 'SATA3/SAS2', diskSpeed: '7.2K', diskType: 'SAS MDL', diskCapacity: '4 TB', diskSerial: 'SPARE 123456-789'},
          {formFactor: 'LFF', interfaceType: 'singlePort', interfaceSpeed: 'SATA3/SAS2', diskSpeed: '5.4K', diskType: 'SATA', diskCapacity: '3 TB', diskSerial: 'SPARE 123456-789'},
          {formFactor: 'LFF', interfaceType: 'singlePort', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD', diskCapacity: '512 GB', diskSerial: 'SPARE 123456-789'},
          {formFactor: 'LFF', interfaceType: 'dualPort', interfaceSpeed: 'SATA2/SAS', diskSpeed: '15K', diskType: 'Fibre Channel', diskCapacity: '1 TB', diskSerial: 'SPARE 123456-789'},
          {formFactor: 'LFF', interfaceType: 'singlePort', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD SSNW', diskCapacity: '1 TB', diskSerial: 'SPARE 123456-789'},
        ]
      },
      dellSFF: {
        title: 'Dell Gen11/12/13/14 2.5" (SFF)',
        vendorType: 'dell',
        fields: [
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '7.2K', diskType: 'SATA', diskCapacity: '512 GB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '5.4K', diskType: 'SATA', diskCapacity: '1 TB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '10K', diskType: 'SATA', diskCapacity: '2 TB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '15K', diskType: 'SATA', diskCapacity: '146 GB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: 'SSD', diskType: 'SATA', diskCapacity: '480 GB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD', diskCapacity: '512 GB', diskSerial: ''},
        ]
      },
      dellLFF: {
        title: 'Dell Gen11/12/13/14 3.5" (LFF)',
        vendorType: 'dell',
        fields: [
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '15K', diskType: 'SAS', diskCapacity: '1 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '10K', diskType: 'SAS', diskCapacity: '2 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '7.2K', diskType: 'SATA', diskCapacity: '4 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '5.4K', diskType: 'SATA', diskCapacity: '8 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: 'SSD', diskType: 'SATA', diskCapacity: '480 GB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD', diskCapacity: '1 TB', diskSerial: ''},
        ]
      },
      smSFF: {
        title: 'Supermicro 2.5" (SFF)',
        vendorType: 'sm',
        fields: [
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SAS', diskCapacity: '512 GB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SAS', diskCapacity: '1 TB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SATA', diskCapacity: '2 TB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SATA', diskCapacity: '3 TB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SATA', diskCapacity: '4 TB', diskSerial: ''},
          {formFactor: 'SFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD', diskCapacity: '512 GB', diskSerial: ''},
        ]
      },
      smLFF: {
        title: 'Supermicro 3.5" (LFF)',
        vendorType: 'sm',
        fields: [
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SAS', diskCapacity: '1 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SAS', diskCapacity: '2 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SATA', diskCapacity: '4 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SATA', diskCapacity: '8 TB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SATA', diskCapacity: '480 GB', diskSerial: ''},
          {formFactor: 'LFF', interfaceType: '', interfaceSpeed: '', diskSpeed: '', diskType: 'SSD', diskCapacity: '1 TB', diskSerial: ''},
        ]
      }
    };

    for (ff in examples) {
      vendorType = examples[ff].vendorType;
      fields = examples[ff].fields;

      $('table#exampleTable tbody').last().append('<tr><td>' + examples[ff].title + '</td>');

      for (item in fields) {
        example = fields[item];
        addUser($(this),example.formFactor,example.interfaceType, example.interfaceSpeed,example.diskSpeed,example.diskType,example.diskCapacity,example.diskSerial,'exampleTable', 7,example.gen);
      }

      $('table#exampleTable tbody').last().append('</tr>');
    }
  }

  /* Helper functions */


  function createFormatTool() {
    // Used to have .format like sprintf in JavaScript. //
    if (!String.prototype.format) {
      String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
          return typeof args[number] != 'undefined'
          ? args[number]
          : match
          ;
        });
      };
    }
  }
});
