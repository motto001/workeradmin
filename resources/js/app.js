require('./bootstrap'); //--------------

window.Vue = require('vue');

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import VueAxios from 'vue-axios';
import axios from 'axios';
Vue.use(VueAxios, axios);

//Vue.component('example-component', require('./components/ExampleComponent.vue'));
Vue.component('modal', { template: '#modal-template' });
const router = new VueRouter({ mode: 'history' });

var app = new Vue({
    el: '#app',
    created() {
        this.PandFwitId('getbasedata');
    },
    data: {
        //paraméterek---------------------------------
        viewpar: window.viewpar,
        viewparid: window.viewparid,
        level: 10, //jogosultság alapból worker
        baseroute: window.viewpar.baseroute,
        host: window.viewpar.host,
        //actuális értékek (kijelölt kiválasztott)-------------
        showModal: false,
        showInfo: false,
        //actTimetype_id: 1, //timetypetype selectlist actuális értéke ()()
        //actTimetype_basehour : '1',
        //actTimetype_start : '00:00',
        //actTimetype_end : '00:00',


        actDaytype_id: 1, //daytype selectlist actuális értéke
        actchecklist: '',
        select_action: 'nothing',
        actWorkerid: 0, // az aktuális worker azonosítója akinek a kalendár adatai megjelennek
        //actTimetype:0,
        // actDaytype:0,


        //base adatok  első betöltéskor lekérve------------------------
        year: window.year,
        month: window.month,
        ceg: '', //cég adatok egyenlőre csak id és név
        daycheckbox: $('input:checkbox.daycheckbox'),
        workers: [], // full worker adatok listázáshoz  id kulcsos
        timetypes: [], //selecthez
        daytypes: [], //selecthez
        // frissítéskor alapból automatikusan elküldve és frissítve------------------------
        datums: [], //kivállasztott napok dátumai idők napok felviteléhez
        workerids: [], //kivállasztott dolgozók azonosítói ezeknek menti a calendar adatokat
        plusdata: {}, //post kérésben plusz adatok küldése a base adatokon kivül
        formdata: null, //post kérésben form adatok küldése a base adatokon kivül
        justdata: null, //ha nem üres a post kérésben csak ezek adatok lesznek elküldve plusz az id ha van a paraméterben

        // lokális select tömbök --------------------------------    
        months: [{ value: 1, text: 'Január' }, { value: 2, text: 'Február' }, { value: 3, text: 'Március' },
            { value: 4, text: 'Április' }, { value: 5, text: 'Május' }, { value: 6, text: 'Június' }, { value: 7, text: 'Július' },
            { value: 8, text: 'Augusztus' }, { value: 9, text: 'Szeptember' }, { value: 10, text: 'Október' },
            { value: 11, text: 'November' }, { value: 12, text: 'Decenber' }
        ],
        checklist: { 'all': 'Mind', 'workday': 'Munkanapok', 'nothing': 'egyiksem', 'inverse': 'fordított' },

        //calaendar adatok-----------------------    
        calendar: [],
        calendarbase: [],
        times: [],
        workerdays: [],
        basedays: [],
        SumData: {}, //összesítet órá n
        SumDays: {}, //összesítet napok
        SumTimes: {}, //összesítet idők
        test: {
            1: '111fff',
            'mmk': 'mmfff',
            'l': '333fff'
        },

    },


    methods: {
        sumWorkerdays() {
            let sumDays = {};
            let ledolgozott = 0;
            $.each(this.workerdays[this.actWorkerid], function(datum, value) {
                $.each(value, function(id, val) {
                    if (val.workday) { ledolgozott++; }
                    if (typeof sumDays[val.name] !== 'undefined') {
                        sumDays[val.name]++;
                    } else {
                        Vue.set(sumDays, val.name, 1);
                    }
                });
            });
            this.SumDays = sumDays;
            console.log(sumDays);
            return ledolgozott;
        },
        sumWorkertimes() {
            let sumTimes = {};
            let sum = 0;
            $.each(this.times[this.actWorkerid], function(datum, value) {
                $.each(value, function(id, val) {
                    sum = sum + val.hour;
                    if (typeof sumTimes[val.name] !== 'undefined') {
                        sumTimes[val.name] = sumTimes[val.name] + val.hour;
                    } else {
                        Vue.set(sumTimes, val.name, val.hour);
                    }
                });
            });
            this.SumTimes = sumTimes;
            console.log(sumTimes);
            return sum;
        },
        setSumData() {
            let nap = 0;
            let munkanap = 0;
            let sumWorkdays = 0;
            let sumhours = 0;
            $.each(this.calendarbase, function(key, value) {
                if (key.substring(0, 4) == '1111' || key.substring(0, 4) == '3333') {} else {
                    nap = nap + 1;
                    if (value.munkanap == true) { munkanap++; }
                }
            });
            sumWorkdays = this.sumWorkerdays();
            sumhours = this.sumWorkertimes();

            Vue.set(this.SumData, 'nap', nap);
            Vue.set(this.SumData, 'munkanap', munkanap);
            Vue.set(this.SumData, 'ledolgozott nap', sumWorkdays);
            Vue.set(this.SumData, 'ledolgozott óra', sumhours);
            // console.log(sumDays);
        },

        faClass(icon) {
            return `fa fa-${icon}`;
        },
        /*
            onfileInputChange(e) {
            let files = e.target.files || e.dataTransfer.files;
            if (!files.length){
                this.formdata.files =files;
            }

        },*/

        //adatok PandFwitId-nek és a child funkcüknak-------------------------------------
        getBaseDataWitId: function(pardata = 0) {
            return {
                id: pardata,
                month: this.month,
                year: this.year,
                cegid: this.cegid,
                workerids: this.workerids,
                datums: this.datums,
                formdata: this.formdata,
                plusdata: this.plusdata,
                viewparid: this.viewparid
            };
        },
        /**
         * elküldi az alap adatokat és a responsból frissíti a this paramétereket
         * ha formadatokat akarun küldeni a this.formdatas ba kell írni 
         * Ha a pardataType= 'id' akkor a pardatas értéke  id kulcsal bekerül a databa
         * Ha a pardataType= 'justpardata' akkor csak a pardata-t küldi el a data-t nem
         * egyébként  'justpardata'
         * @param  route //host nem kell alapból hozzáteszi
         */
        postAndFresh: function(task = 'calendar/', data = null) {

            axios.post(this.host + this.baseroute + task, data)
                .then(response => {
                    //this.storeds=[];
                    Object.entries(response.data).forEach(this.DataRefresh);
                    if (task == 'getbasedata') {
                        let workerid = Object.keys(this.workers)[0];
                        this.actWorkerid = workerid;
                        this.workerids = [workerid];
                    }
                    this.setSumData();
                }).catch(function(error) {
                    alert(error);
                });
        },

        showModalInfo: function() { this.showInfo = true; },


        DataRefresh: function(value, key, response) {
            //  alert(key);
            this[value[0]] = value[1];
        },
        setActWorkerid: function(worker) {
            this.actWorkerid = worker.id;
            // this.ActWorker=worker;
            this.workerids = [worker.id];
            this.setSumData();
        },
        //selectChange: function () {alert('ttt');},
        selectDays: function() {
            //  alert(this.select_action); this.rows.push('');
            if (this.select_action == 'all') {
                this.datums = $('input:checkbox.daycheckbox').map(
                    function() { return this.value; }).get();
            } else if (this.select_action == 'workday') {
                this.datums = $('input:checkbox.workdaycheckbox').map(
                    function() { return this.value; }).get();
            } else if (this.select_action == 'inverse') {
                let list = $('input:checkbox.daycheckbox').map(
                    function() { return this.value; }).get();
                let temp = [];
                list.forEach((value, index) => {
                    //if(!$('#'+value).prop('checked')) {temp.push(value);} 
                    if (!this.datums.includes(value)) { temp.push(value); }
                });
                this.datums = [];
                this.datums = temp;
            } else if (this.select_action == 'nothing') { this.datums = []; }
        },
        // PandFwitId  childek-----------------------------

        PandFwitId: function(task = 'calendar/', id = 0) {
            this.postAndFresh(task, this.getBaseDataWitId(id));


        },

        // zárások-----PandFwitId taskok: storeStoreds,'delStored(id),zarStored(cegid),nyitStored(cegid)-----
        /*
        showStored: function(id) {
                this.storedToShow=JSON.parse(this.storeds[id]['fulldata']);
                this.workerid=this.storeds[id]['worker_id'];
                this.solver=JSON.parse(this.storeds[id]['solverdata']);
                this.storedid=id;
                this.showModal= true; 
        },
        delStored: function(id) {
            this.PandFwitId('delstored',id);
        },
        storeStoreds: function() {
            this.PandFwitId('storestored');
        }
        ,nyitStored: function(id) {
            this.PandFwitId('nyitstored',id);
        },
        zarStored: function(id) {
            this.PandFwitId('zarstored',id);
        },*/
        //timeframes------------------------------------------

        /*  getTimeFrames: function () {
            this.formdata = {
                start: $("input[name=start]").val(),
                end: $("input[name=end]").val(),
                szorzo: $("input[name=norma]").val(),
                justworkdays:'all',
            }  ;
            if ($("#workday").is(':checked')) {this.formdata.justworkdays='workdays';}
            this.PandFwitId('timeframes'); 
            },*/

        // idők -----------taskok:'deltime(id),-----------------

        timesreset: function() {
            if (confirm("A kijelölt dolgozók és napok idő bejegyzései végleg törlődni fognak. Biztos hogy ezt akarja?")) {
                this.PandFwitId('resettimes');
            };
        },

        deltime: function(id) {
            this.PandFwitId('deltime', id);
        },
        storetimes: function() {

            this.formdata = {
                end: $("input[name=end]").val(),
                start: $("input[name=start]").val(),
                timetype_id: $('input[name=timetype_id]:checked').val(),
                hour: $("input[name=hour]").val(),
                // pubbase: $('input[name="pubtime"]:checked').val(),
                adnote: $("input[name=timeadnote]").val(),
            };
            /*   this.formdata.end = $("input[name=end]").val();
                this.formdata.timetype_id=  $("select[name=timetype_id]").val();
                this.formdata.hour = $("input[name=hour]").val();
                this.formdata.pubbase=  $('input[name="pubtime"]:checked').val();
            **/
            this.PandFwitId('storetimes');
        },
        // napok------taskok:'delday(id),---------------------------------------  

        daysreset: function() {
            if (confirm("A kijelölt dolgozók és napok napbejegyzései végleg törlődni fognak. Biztos hogy ezt akarja?")) {
                this.PandFwitId('resetdays');
            };
        },
        delday: function(id) {
            this.PandFwitId('delday', id);
        },
        storedays: function() {
            this.formdata = {
                workernote: $("input[name=workernote]").val(),
                //  daytype_id: $("select[name=daytype_id]").val(),
                daytype_id: $('input[name=daytype_id]:checked').val(),
                // pubbase: $('input[name="pubday"]:checked').val(),
                adnote: $("input[name=dayadnote]").val()
            }
            this.PandFwitId('storedays');
        },
        // file-----------------------------------
        /*filesreset: function() {
            if(confirm("A kijelölt napok file bejegyzései végleg törlődni fognak. Biztos hogy ezt akarja?")){
                this.PandFwitId('filesreset');
            };  
        },

        storefiles: function() { 
            this.PandFwitId('storefiles');
            this.formdatas ={};  
            },*/

        //év hó----------------------------------------------
        minusyear: function(task = null) {
            this.year--;
            this.PandFwitId(task);
        },
        addyear: function(task = null) {
            this.year++;
            this.PandFwitId(task);
        },

        changeEv: function(task = null) {
            this.year = event.target.value;
            this.calendarFresh(task);
        },
        changeHo: function(task = null) {
            //ho = rowId ;
            this.PandFwitId(task);
        },

        //kijelölések------------------------------------ 
        uncheckday: function(dayid) {
            this.dayids.splice(this.dayids.indexOf(dayid), 1);
        },

        //felső tabok váltása----------------------------------------------
        isAdminActive: function(menuItem) {
            return this.activeTab === menuItem;
        },
        setAdminActive: function(menuItem) {
            this.activeTab = menuItem;
        },
        isActive: function(menuItem) {
            return this.activeTab === menuItem;
        },
        setActive: function(menuItem) {
            this.activeTab = menuItem;
        },
        //worker tab kinyitás összecsukás-----------------------------
        toggleWorker: function(workerid) {
            $("#" + workerid).toggle();
        },

    }
});