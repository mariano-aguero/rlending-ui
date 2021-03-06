<template>
  <div class="time-balance">
    <v-row class="ma-0">
      <v-col cols="8" class="pa-0">
        <v-row class="ma-0">
          <h1>My Overall Balance Over Time:</h1>
        </v-row>
        <v-row class="ma-0">
          <span>Earnings in USD</span>
        </v-row>
        <v-row class="ma-0">
          <v-divider/>
        </v-row>
      </v-col>
      <v-col class="d-flex align-center">
        <v-row class="d-flex justify-end mr-1">
          <div class="toggle-tb d-flex align-center">
            <v-btn text :class="[period === constants.PERIOD_DAY ? 'selected' : 'notSelected']"
                   @click="getChartData(constants.PERIOD_DAY)">
              1D
            </v-btn>
            <v-btn text :class="[period === constants.PERIOD_WEEK ? 'selected' : 'notSelected']"
                   @click="getChartData(constants.PERIOD_WEEK)">
              1W
            </v-btn>
            <v-btn text :class="[period === constants.PERIOD_MONTH ? 'selected' : 'notSelected']"
                   @click="getChartData(constants.PERIOD_MONTH)">
              1M
            </v-btn>
            <v-btn text :class="[period === constants.PERIOD_YEAR ? 'selected' : 'notSelected']"
                   @click="getChartData(constants.PERIOD_YEAR)">
              1Y
            </v-btn>
          </div>
        </v-row>
      </v-col>
    </v-row>
    <v-row class="ma-0 pt-8">
      <GChart class="all-width" type="LineChart" :data="chartData" :options="chartOptions"/>
    </v-row>
  </div>
</template>

<script>
import { GChart } from 'vue-google-charts';
import * as constants from '@/store/constants';
import { mapState } from 'vuex';

export default {
  name: 'TimeBalanceGraph',
  data() {
    return {
      constants,
      chartData: [
        ['Date', 'Balance'],
        ['2014', 0],
      ],
      chartOptions: {
        height: 250,
        chartArea: {
          left: '10%',
          right: '5%',
          width: '60%',
          height: '85%',
        },
        legend: 'none',
        fontName: 'Rubik',
        colors: ['#24BD6B'],
      },
      weekLabels: [
        { key: 0, value: 'Sunday' },
        { key: 1, value: 'Monday' },
        { key: 2, value: 'Tuesday ' },
        { key: 3, value: 'Wednesday' },
        { key: 4, value: 'Thursday' },
        { key: 5, value: 'Friday' },
        { key: 6, value: 'Saturday' },
      ],
      monthLabels: [
        { key: 0, value: 'January' },
        { key: 1, value: 'February' },
        { key: 2, value: 'March ' },
        { key: 3, value: 'April' },
        { key: 4, value: 'May' },
        { key: 5, value: 'June' },
        { key: 6, value: 'July' },
        { key: 7, value: 'August' },
        { key: 8, value: 'September' },
        { key: 9, value: 'October' },
        { key: 10, value: 'November' },
        { key: 11, value: 'December' },
      ],
      period: 'week',
    };
  },
  computed: {
    ...mapState({
      account: (state) => state.Session.account,
    }),
  },
  methods: {
    mapTimeToLabel(period, date) {
      switch (period) {
        case constants.PERIOD_DAY:
          return date;
        case constants.PERIOD_WEEK:
          return this.weekLabels[date.getDay()].value;
        case constants.PERIOD_MONTH:
          return date;
        case constants.PERIOD_YEAR:
          return this.monthLabels[date.getMonth()].value;
        default:
          return this.weekLabels[date.getDay()].value;
      }
    },
    getChartData(period) {
      this.period = period;
      this.$rbank.controller.getOverallBalance(this.account, period)
        .then((overallBalance) => overallBalance
          .map(([date, balance]) => [
            this.mapTimeToLabel(period, date),
            balance,
          ]))
        .then((overallBalance) => {
          overallBalance.reverse();
          this.chartData = Array.from(new Set(overallBalance.map(JSON.stringify)), JSON.parse);
          this.chartData.unshift(['Time', 'Balance']);
        });
    },
  },
  components: {
    GChart,
  },
  created() {
    this.getChartData('week');
  },
};
</script>
