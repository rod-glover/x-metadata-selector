import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

import meta from '../../assets/meta'
import './App.css';
import VariableSelector from '../VariableSelector';

class App extends Component {
  render() {
    return (
      <Grid fluid>
        <Row>
          <Col lg={3}>
            <VariableSelector meta={meta}/>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default App;
