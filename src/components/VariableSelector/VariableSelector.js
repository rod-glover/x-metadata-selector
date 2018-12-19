import PropTypes from 'prop-types';
import React from 'react';
import Select, { components } from 'react-select';
import { Glyphicon } from 'react-bootstrap';

import memoize from "memoize-one";

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
  // console.log('MyOption', props)
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
    value: PropTypes.any,
    onChange: PropTypes.func,
  };

  static variable_props =
    'variable_id variable_name multi_year_mean'.split(' ');

  optionValueToLabel = ({ variable_id, variable_name }) =>
    `${variable_id} - ${variable_name}`;

  // Memoize computation of options list
  // See https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization

  allOptions = memoize(
    (meta) => flow(
      map(pick(VariableSelector.variable_props)),
      uniqBy(JSON.stringify),
      map(value => (
        {
          value,
          label: this.optionValueToLabel(value),
        }
      )),
      sortBy('value.variable_id'),
    )(meta)
  );

  // Doesn't need to be memoized
  mymOptions = memoize(
    (meta) => filter(o => o.value.multi_year_mean)(this.allOptions(meta))
  );

  // Doesn't need to be memoized
  notMymOptions = memoize(
    (meta) => filter(o => !o.value.multi_year_mean)(this.allOptions(meta))
  );

  options = memoize(
    (meta) => [
      {
        label: 'Multi-Year Mean Datasets',
        options: this.mymOptions(meta),
      },
      {
        label: 'Time Series Datasets',
        options: this.notMymOptions(meta),
      },
    ]
  );

  render() {
    return (
      <Select
        isSearchable
        options={this.options(this.props.meta)}
        components={{ Option: MyOption }}
        value={this.props.value}
        onChange={this.props.onChange}
      />
    );
  }
}
