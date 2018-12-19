import PropTypes from 'prop-types';
import React from 'react';
import Select, { components } from 'react-select';
import { Glyphicon } from 'react-bootstrap';

import memoize from "memoize-one";

import flow from 'lodash/fp/flow';
import constant from 'lodash/fp/constant';
import identity from 'lodash/fp/identity';
import map from 'lodash/fp/map';
import filter from 'lodash/fp/filter';
import find from 'lodash/fp/find';
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
    constraint: PropTypes.object,
    value: PropTypes.any,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    constraint: constant(true),
  };

  static contextProps =
    'model_id, experiment'.split(' ');
  static variableProps =
    'variable_id variable_name multi_year_mean'.split(' ');

  optionValueToLabel = ({ variable_id, variable_name }) =>
    `${variable_id} - ${variable_name}`;

  // Memoize computation of options list
  // See https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization

  allOptions = memoize(
    meta => flow(
      map(m => ({
        context: pick(VariableSelector.contextProps)(m),
        value: pick(VariableSelector.variableProps)(m),
      })),
      uniqBy(({ value }) => JSON.stringify(value)),
      map(({ context, value }) => (
        { context, value, label: this.optionValueToLabel(value) }
      )),
      sortBy('value.variable_id'),
    )(meta)
  );

  mymOptions =
    meta => filter(o => o.value.multi_year_mean)(this.allOptions(meta));

  notMymOptions =
    meta => filter(o => !o.value.multi_year_mean)(this.allOptions(meta));

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

  // Value-exchange functions

  optionFor = value => find({ value })(this.allOptions(this.props.meta));

  handleChange = option => this.props.onChange(option.value);

  render() {
    return (
      <Select
        isSearchable
        options={this.options(this.props.meta)}
        components={{ Option: MyOption }}
        value={this.optionFor(this.props.value)}
        onChange={this.handleChange}
      />
    );
  }
}
