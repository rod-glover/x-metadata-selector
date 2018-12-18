import PropTypes from 'prop-types';
import React from 'react';
import Select, { components } from 'react-select';
import { Glyphicon } from 'react-bootstrap';

import flow from 'lodash/fp/flow';
import identity from 'lodash/fp/identity';
import map from 'lodash/fp/map';
import filter from 'lodash/fp/filter';
import pick from 'lodash/fp/pick';
import sortBy from 'lodash/fp/sortBy';
import uniqBy from 'lodash/fp/uniqBy';

import tap from 'lodash/fp/tap';

import './VariableSelector.css';


const { Option } = components;

const MyOption = props => {
  console.log('MyOption', props)
  return (
  <Option {...props}>
    <Glyphicon glyph={props.value.multi_year_mean ? 'repeat' : 'star'}/>
    {' '}
    {props.label}
  </Option>
)};


export default class VariableSelector extends React.Component {
  static propTypes = {
    meta: PropTypes.array,
  };

  static variable_props =
    'variable_id variable_name multi_year_mean'.split(' ');


  optionValueToLabel = ({ variable_id, variable_name }) =>
    `${variable_id} - ${variable_name}`;

  render() {
    const allOptions = flow(
      map(pick(VariableSelector.variable_props)),
      uniqBy(JSON.stringify),
      map(value => (
        {
          value,
          label: this.optionValueToLabel(value),
        }
      )),
      sortBy('value.variable_id'),
    )(this.props.meta);
    const mymOptions = filter(o => o.value.multi_year_mean)(allOptions);
    const notMymOptions = filter(o => !o.value.multi_year_mean)(allOptions);
    const options = [
      {
        label: 'Multi-Year Mean Datasets',
        options: mymOptions,
      },
      {
        label: 'Time Series Datasets',
        options: notMymOptions,
      },
    ];

    return (
      <Select
        isSearchable
        options={options}
        components={{ Option: MyOption }}
      />
    );
  }
}
