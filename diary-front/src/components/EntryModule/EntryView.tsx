import React from 'react';

import { Button, Col, Row } from 'antd';

import util from 'utils/util';

import EntryFormContainer from 'components/EntryModule/EntryFormContainer';
import EntryTrendChartContainer from 'components/EntryModule/EntryTrendChartContainer';
import EntryWeekContainer from 'components/EntryModule/EntryWeekContainer';

import './EntryView.css';

class State {
  public offset: number = 0;
}
class EntryView extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = new State();
  }

  public handleArrowButtonClick = (direction: 'left' | 'right') => () => {
    this.setState({
      offset: this.state.offset + (direction === 'left' ? -1 : +1),
    });
  };

  public render() {
    const { offset } = this.state;
    return (
      <div className="EntryView">
        <h2>EntryView</h2>
        <EntryWeekContainer date={util.getTodayStringWithOffset(offset * 7)} />
        <Row type="flex" justify="space-between">
          <Col span={2} className="ArrowButtonColDiv">
            <div className="ArrowButtonDiv">
              <Button
                shape="circle"
                icon="left"
                onClick={this.handleArrowButtonClick('left')}
              />
            </div>
          </Col>
          <Col span={20}>
            <EntryFormContainer />
          </Col>
          <Col span={2} className="ArrowButtonColDiv">
            <div className="ArrowButtonDiv">
              <Button
                shape="circle"
                icon="right"
                onClick={this.handleArrowButtonClick('right')}
              />
            </div>
          </Col>
        </Row>
        <EntryTrendChartContainer offset={offset * 7} />
      </div>
    );
  }
}
export default EntryView;
