import * as moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';

import { Button, Col, message, Row } from 'antd';
import Clock from 'react-live-clock';

import { ReduxState, User } from 'reducers';
import { dispatch } from 'reducers/store';
import api, {
  EntriesDateMap,
  Entry,
  ErrResponse,
  GetEntriesResponse,
} from 'utils/api';
import util from 'utils/util';

import DiaryInputNumber from 'components/common/InputNumber';
import EntryFormContainer from 'components/EntryModule/EntryFormContainer';
import EntrySearchListContainer from 'components/EntryModule/EntrySearchListContainer';
import EntryTrendChartContainer from 'components/EntryModule/EntryTrendChartContainer';
import EntryWeekContainer from 'components/EntryModule/EntryWeekContainer';

import './EntryView.css';

class State {
  public tipOffset: number = 0;
  public lastDaysRange: number = 14;
}
class ReduxProps {
  public entriesDateMap: EntriesDateMap;
  public user: User | null;
  public resyncCounter: number;
}
class EntryView extends React.Component<ReduxProps, State> {
  constructor(props: ReduxProps) {
    super(props);
    this.state = new State();
  }

  public async fetchDaysEntries(
    entriesDateMap: EntriesDateMap,
    user: User | null,
    dateRange: string[]
  ) {
    if (!user) {
      return;
    }

    const missingDays = dateRange.filter(
      (dateString) => !entriesDateMap[dateString]
    );
    if (missingDays.length === 0) {
      return;
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
            const newEntriesByDate: EntriesDateMap = {};
            missingDays.forEach((date: string) => {
              newEntriesByDate[date] = [];
            });
            data.data.forEach((entry) => {
              newEntriesByDate[entry.date].push(entry);
            });
            dispatch({
              type: 'ENTRIES_FOR_DATE',
              payload: newEntriesByDate,
            });
          }
        },
        (err) => {}
      );
  }

  public handleArrowButtonClick = (direction: 'left' | 'right') => () => {
    this.setState({
      tipOffset: this.state.tipOffset + (direction === 'left' ? -1 : +1),
    });
  };

  public handleDaysRangeChange = async (newVal: number) => {
    await this.setState({ lastDaysRange: newVal * 7 });
  };

  public componentDidMount() {
    const { entriesDateMap, user } = this.props;
    const { tipOffset, lastDaysRange } = this.state;

    const dateRange = util.getDateStringsFromDateRange(
      tipOffset,
      lastDaysRange
    );

    this.fetchDaysEntries(entriesDateMap, user, dateRange);
  }

  public componentDidUpdate(
    prevProps: ReduxProps,
    prevState: State,
    snapshot: any
  ) {
    const { entriesDateMap, user } = this.props;
    const { tipOffset, lastDaysRange } = this.state;

    const dateRange = util.getDateStringsFromDateRange(
      tipOffset,
      lastDaysRange
    );

    if (this.props.resyncCounter !== prevProps.resyncCounter) {
      this.fetchDaysEntries({}, user, dateRange);
    } else {
      this.fetchDaysEntries(entriesDateMap, user, dateRange);
    }
  }

  public render() {
    const { tipOffset, lastDaysRange } = this.state;
    const tipDayString = util.getTodayStringWithOffset(tipOffset);
    const tailDayString = moment(tipDayString)
      .add(-(lastDaysRange - 1), 'days')
      .format(util.dateStringFormat);
    const dateRange = util.getDateStringsFromDateRange(
      tipOffset,
      lastDaysRange
    );

    return (
      <div className="EntryView">
        <Row type="flex" style={{ alignItems: 'center' }}>
          <h2>EntryView</h2>
          <Clock format={'dddd, YYYY-MM-DDTHH:mm:ss'} ticking={true} />
        </Row>

        <Row type="flex" justify="space-between">
          <Col span={24}>
            <EntryFormContainer />
          </Col>
        </Row>

        <Row
          className="ArrowButtonRowDiv"
          type="flex"
          style={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <Col className="ArrowButtonColDiv">
            <div className="ArrowButtonDiv">
              <Button
                shape="circle"
                icon="left"
                onClick={this.handleArrowButtonClick('left')}
              />
            </div>
          </Col>
          <Col>
            <span>{`${tailDayString} - ${tipDayString}`}</span>
          </Col>
          <Col className="ArrowButtonColDiv">
            <div className="ArrowButtonDiv">
              <Button
                shape="circle"
                icon="right"
                onClick={this.handleArrowButtonClick('right')}
              />
            </div>
          </Col>
        </Row>
        <Row
          type="flex"
          style={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <DiaryInputNumber
            onChange={this.handleDaysRangeChange}
            suffix="weeks"
            prefix="Showing"
          />
        </Row>
        <EntryTrendChartContainer dateRange={dateRange} />
        <EntryWeekContainer dateRange={dateRange} />
        <EntrySearchListContainer dateRange={dateRange} />
      </div>
    );
  }
}

export default connect<ReduxProps, {}, {}>((state: ReduxState) => {
  return {
    entriesDateMap: state.entriesDateMap,
    user: state.user,
    resyncCounter: state.resyncCounter,
  };
})(EntryView);
