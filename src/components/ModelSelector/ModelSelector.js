import PropTypes from 'prop-types';
import React from 'react';
import Select, { components } from 'react-select';

import memoize from 'memoize-one';

import {
  curry,
  flow,
  identity,
  isMatch,
  map,
  filter,
  find,
  pick,
  sortBy,
  sortedUniqBy,
  groupBy,
  toPairs,
  some,
  tap,
} from 'lodash/fp'

import './ModelSelector.css';


export default class ModelSelector extends React.Component {
  static propTypes = {
    meta: PropTypes.array,
    value: PropTypes.any,
    onChange: PropTypes.func,
  };

  options = memoize(
    meta => flow(
      map(m => ({
        value: m.model_id,
        label: m.model_id,
      })),
      sortBy('value'),
      sortedUniqBy('value'),
    )(meta)
  );

  // Value-exchange functions

  optionFor = value => find({ value })(this.options(this.props.meta));

  handleChange = option => this.props.onChange(option.value);

  render() {
    return (
      <Select
        isSearchable
        options={this.options(this.props.meta)}
        value={this.optionFor(this.props.value)}
        onChange={this.handleChange}
      />
    );
  }
}
