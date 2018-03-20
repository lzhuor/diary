import { message } from 'antd';
import React from 'react';
import { connect } from 'react-redux';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { ReduxState, User } from 'reducers';
import { dispatch } from 'reducers/store';
import api, { Entry, ErrResponse, GetEntriesResponse } from 'utils/api';
import util from 'utils/util';

const barLowValue = 8;
const barHighValue = 12;
const barLowColor = '#006600';
const barHighColor = '#990000';
const chartColorPanel = [
  'rgba(57,73,82,1)',
  'rgba(111,171,132,1)',
  'rgba(235,183,71,1)',
  'rgba(227,130,49,1)',
  'rgba(166,88,49,1)',
  'rgba(32,185,117,1)',
  'rgba(247,203,115,1)',
  'rgba(247,134,41,1)',
  'rgba(223,80,41,1)',
  'rgba(114,103,69,1)',
  'rgba(52,47,71,1)',
  'rgba(40,96,96,1)',
  'rgba(44,133,129,1)',
  'rgba(183,204,169,1)',
  'rgba(222,229,161,1)',
  'rgba(98,166,135,1)',
  'rgba(44,142,158,1)',
  'rgba(62,89,94,1)',
  'rgba(67,59,74,1)',
  'rgba(40,181,133,1)',
  'rgba(254,232,158,1)',
  'rgba(240,120,18,1)',
  'rgba(12,51,63,1)',
  'rgba(57,79,85,1)',
  'rgba(23,173,187,1)',
  'rgba(126,184,167,1)',
  'rgba(254,247,216,1)',
  'rgba(241,101,104,1)',
  'rgba(248,232,213,1)',
  'rgba(210,192,167,1)',
  'rgba(105,98,59,1)',
  'rgba(46,61,52,1)',
  'rgba(120,122,99,1)',
];

class Props {}
class ReduxProps {
  public entriesDateMap: {
    [date: string]: Entry[];
  };
  public user: User | null;
}
class State {
  public isLoading: boolean = true;
  public err: any;
  public last14Days: string[] = new Array(14)
    .fill(0)
    .map((_, i) => i)
    .map((offset) => util.getTodayStringWithOffset(-offset))
    .reverse();
}
class DiaryTrendChartContainer extends React.Component<ReduxProps, State> {
  constructor(props: ReduxProps) {
    super(props);
    this.state = new State();
  }

  public componentDidMount() {
    const { entriesDateMap, user } = this.props;
    const { last14Days } = this.state;

    if (!user) {
      return;
    }
    const missingDays = last14Days.filter(
      (dateString) => !entriesDateMap[dateString]
    );
    if (missingDays.length === 0) {
      return this.setState({ isLoading: false });
    }
    api
      .getEntries(
        {
          owner: user.username,
          date: missingDays.join(','),
        },
        { encodeComponents: false }
      )
      .then(
        (data: GetEntriesResponse & ErrResponse) => {
          if (data.err) {
            message.warn('' + data.err);
          } else {
            const newEntriesByDate: {
              [date: string]: Entry[];
            } = {};
            missingDays.forEach((date) => {
              newEntriesByDate[date] = [];
            });
            data.data.forEach((entry) => {
              newEntriesByDate[entry.date].push(entry);
            });
            dispatch({
              type: 'ENTRIES_FOR_DATE',
              payload: newEntriesByDate,
            });
            this.setState({ isLoading: false });
          }
        },
        (err) => {
          this.setState({ err });
        }
      );
  }

  public getChartDataAndAreasFromDaysAndEntriesDateMap(
    days: string[],
    entriesDateMap: {
      [date: string]: Entry[];
    }
  ): any {
    const allKeys = new Set();
    const chartData = days
      .map((date) => {
        const entries = entriesDateMap[date];
        const res = {
          date,
          _barLow: barLowValue,
          _barHigh: barHighValue,
          Sum: 0,
        };
        entries.forEach((entry) => {
          allKeys.add(entry.title);
          res[entry.title] = res[entry.title]
            ? res[entry.title] + entry.points
            : entry.points;
        });
        return res;
      })
      .map((dataPoint) => {
        allKeys.forEach((key) => {
          dataPoint[key] = dataPoint[key] || 0;
        });
        return dataPoint;
      });
    const areas = [...allKeys.keys(), '_barLow', '_barHigh']
      .sort()
      .map((key) => {
        const colorIdx = Math.abs(util.stringHashCode(key)) % 33;
        console.log('XXX colorIdx', colorIdx, chartColorPanel[colorIdx]);
        const props = {
          type: 'linear' as 'linear',
          dataKey: key,
          stackId: '3',
          stroke: chartColorPanel[colorIdx],
          fill: util.setOpacity(chartColorPanel[colorIdx], 0.24),
          dot: true,
          label: {
            formatter: (label: number | string) => {
              if (+label === 0) {
                return null;
              }
              return +label;
            },
            position: 'right',
          },
        };
        if (key === '_barLow') {
          Object.assign(props, {
            stackId: '1',
            stroke: barLowColor,
            fill: 'transparent',
            dot: false,
            name: 'Bar low',
            strokeWidth: 2,
            strokeDasharray: '5 5',
            strokeOpacity: 0.8,
            label: false,
          });
        } else if (key === '_barHigh') {
          Object.assign(props, {
            stackId: '2',
            stroke: barHighColor,
            fill: 'transparent',
            dot: false,
            name: 'Bar high',
            strokeWidth: 2,
            strokeDasharray: '5 5',
            strokeOpacity: 0.8,
            label: false,
          });
        }
        return <Area key={key} {...props} />;
      });
    return { areas, chartData };
  }

  public render() {
    const { entriesDateMap } = this.props;
    const { last14Days, isLoading, err } = this.state;
    if (isLoading) {
      return <h1>DiaryTrendChartContainer loading...</h1>;
    } else if (err) {
      return util.errComponent;
    }
    const {
      chartData,
      areas,
    } = this.getChartDataAndAreasFromDaysAndEntriesDateMap(
      last14Days,
      entriesDateMap
    );

    return (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="date" padding={{ left: 30, right: 30 }} />
          <YAxis padding={{ top: 10, bottom: 0 }} />
          <Legend />
          <CartesianGrid strokeDasharray="3 3" />
          {areas}
        </AreaChart>
      </ResponsiveContainer>
    );
  }
}

export default connect<ReduxProps, {}, Props>((state: ReduxState) => {
  return {
    entriesDateMap: state.entriesDateMap,
    user: state.user,
  };
})(DiaryTrendChartContainer as any);