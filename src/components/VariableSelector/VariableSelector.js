import PropTypes from 'prop-types';
import React from 'react';
import Select from 'react-select';

import flow from 'lodash/fp/flow';
import map from 'lodash/fp/map';
import pick from 'lodash/fp/pick';
import uniqBy from 'lodash/fp/uniqBy';

import './VariableSelector.css';

export default class VariableSelector extends React.Component {
  static propTypes = {
    meta: PropTypes.array,
  };

  optionValueToLabel =
    ({ variable_id, variable_name }) => `${variable_id} - ${variable_name}`;
  getOptionLabel = option => this.optionValueToLabel(option.value);

  render() {
    const options = flow(
      uniqBy(this.optionValueToLabel),
      map(m => (
        { value: pick(['variable_id', 'variable_name'])(m) }
      ))
    )(this.props.meta);

    return (
      <Select
        isSearchable
        options={options}
        getOptionLabel={this.getOptionLabel}
      />
    );
  }
}
