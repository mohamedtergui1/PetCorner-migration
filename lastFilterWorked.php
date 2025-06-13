<?php
/* Copyright (C) 2015   Jean-François Ferry     <jfefe@aternatik.fr>
 * Copyright (C) 2019   Cedric Ancelin          <icedo.anc@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

use Luracast\Restler\RestException;

require_once DOL_DOCUMENT_ROOT.'/product/class/product.class.php';
require_once DOL_DOCUMENT_ROOT.'/fourn/class/fournisseur.product.class.php';
require_once DOL_DOCUMENT_ROOT.'/categories/class/categorie.class.php';
require_once DOL_DOCUMENT_ROOT.'/variants/class/ProductAttribute.class.php';
require_once DOL_DOCUMENT_ROOT.'/variants/class/ProductAttributeValue.class.php';
require_once DOL_DOCUMENT_ROOT.'/variants/class/ProductCombination.class.php';
require_once DOL_DOCUMENT_ROOT.'/variants/class/ProductCombination2ValuePair.class.php';

/**
 * API class for products
 *
 * @access protected
 * @class  DolibarrApiAccess {@requires user,external}
 */
class Products extends DolibarrApi
{
    /**
     * @var array   $FIELDS     Mandatory fields, checked when create and update object
     */
    public static $FIELDS = array(
        'ref',
        'label'
    );

    /**
     * @var Product $product {@type Product}
     */
    public $product;

    /**
     * @var ProductFournisseur $productsupplier {@type ProductFournisseur}
     */
    public $productsupplier;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $db, $conf;

        $this->db = $db;
        $this->product = new Product($this->db);
        $this->productsupplier = new ProductFournisseur($this->db);
    }

    /**
     * Get properties of a product object by id
     *
     * Return an array with product information.
     *
     * @param  int    $id                  ID of product
     * @param  int    $includestockdata    Load also information about stock (slower)
     * @param  bool   $includesubproducts  Load information about subproducts
     * @param  bool   $includeparentid     Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includetrans           Load also the translations of product label and description
     * @return array|mixed                 Data without useless information
     *
     * @throws RestException 401
     * @throws RestException 403
     * @throws RestException 404
     */
    public function get($id, $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includetrans = false)
    {
        return $this->_fetch($id, '', '', '', $includestockdata, $includesubproducts, $includeparentid, false, $includetrans);
    }
    
    
    
    
    /**
     * Get properties of a product object by id
     *
     * Return an array with product information.
     *
     * @param  int    $id                  ID of product
     * @param  int    $includestockdata    Load also information about stock (slower)
     * @param  bool   $includesubproducts  Load information about subproducts
     * @param  bool   $includeparentid     Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includetrans           Load also the translations of product label and description
     * @return array|mixed                 Data without useless information
     *
     * @throws RestException 401
     * @throws RestException 403
     * @throws RestException 404
     */
     
     
         public function getAll($id, $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includetrans = false)
    {
        return $this->_fetch($id, '', '', '', $includestockdata, $includesubproducts, $includeparentid, false, $includetrans);
    }

    /**
     * Get properties of a product object by ref
     *
     * Return an array with product information.
     *
     * @param  string $ref                Ref of element
     * @param  int    $includestockdata   Load also information about stock (slower)
     * @param  bool   $includesubproducts Load information about subproducts
     * @param  bool   $includeparentid    Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includetrans          Load also the translations of product label and description
     *
     * @return array|mixed                 Data without useless information
     *
     * @url GET ref/{ref}
     *
     * @throws RestException 401
     * @throws RestException 403
     * @throws RestException 404
     */
    public function getByRef($ref, $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includetrans = false)
    {
        return $this->_fetch('', $ref, '', '', $includestockdata, $includesubproducts, $includeparentid, false, $includetrans);
    }

    /**
     * Get properties of a product object by ref_ext
     *
     * Return an array with product information.
     *
     * @param  string $ref_ext            Ref_ext of element
     * @param  int    $includestockdata   Load also information about stock (slower)
     * @param  bool   $includesubproducts Load information about subproducts
     * @param  bool   $includeparentid    Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includetrans          Load also the translations of product label and description
     *
     * @return array|mixed Data without useless information
     *
     * @url GET ref_ext/{ref_ext}
     *
     * @throws RestException 401
     * @throws RestException 403
     * @throws RestException 404
     */
    public function getByRefExt($ref_ext, $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includetrans = false)
    {
        return $this->_fetch('', '', $ref_ext, '', $includestockdata, $includesubproducts, $includeparentid, false, $includetrans);
    }

    /**
     * Get properties of a product object by barcode
     *
     * Return an array with product information.
     *
     * @param  string $barcode            Barcode of element
     * @param  int    $includestockdata   Load also information about stock (slower)
     * @param  bool   $includesubproducts Load information about subproducts
     * @param  bool   $includeparentid    Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includetrans          Load also the translations of product label and description
     *
     * @return array|mixed Data without useless information
     *
     * @url GET barcode/{barcode}
     *
     * @throws RestException 401
     * @throws RestException 403
     * @throws RestException 404
     */
    public function getByBarcode($barcode, $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includetrans = false)
    {
        return $this->_fetch('', '', '', $barcode, $includestockdata, $includesubproducts, $includeparentid, false, $includetrans);
    }

    /**
     * List products
     *
     * Get a list of products az
     *
     * @param  string $sortfield              Sort field
     * @param  string $sortorder              Sort order
     * @param  int    $limit                  Limit for list
     * @param  int    $page                   Page number
     * @param  int    $mode                   Use this param to filter list (0 for all, 1 for only product, 2 for only service)
     * @param  int    $category               Use this param to filter list by category
     * @param  string $sqlfilters             Other criteria to filter answers separated by a comma. Syntax example "(t.tobuy:=:0) and (t.tosell:=:1)"
     * @param  bool   $ids_only               Return only IDs of product instead of all properties (faster, above all if list is long)
     * @param  int    $variant_filter       Use this param to filter list (0 = all, 1=products without variants, 2=parent of variants, 3=variants only)
     * @param  bool   $pagination_data       If this parameter is set to true the response will include pagination data. Default value is false. Page starts from 0
     * @param  int    $includestockdata        Load also information about stock (slower)
     * @return array                        Array of product objects
     */
    public function index($sortfield = "t.ref", $sortorder = 'ASC', $limit = 100, $page = 0, $mode = 0, $category = 0, $sqlfilters = '', $ids_only = false, $variant_filter = 0, $pagination_data = false, $includestockdata = 0)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $obj_ret = array();

        $socid = DolibarrApiAccess::$user->socid ? DolibarrApiAccess::$user->socid : '';

        $sql = "SELECT t.rowid, t.ref, t.ref_ext";
        
    $sql.=",(SELECT CONCAT('https://ipos.ma/fide/documents/',ecm.filepath,'/',ecm.filename) FROM 
".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr WHERE pr.barcode = t.barcode
 AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1) as photo_link ";
        
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."product_extrafields AS ef ON ef.fk_object = t.rowid";    // So we will be able to filter on extrafields
        if ($category > 0) {
            $sql .= ", ".$this->db->prefix()."categorie_product as c";
        }
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';

        if ($variant_filter == 1) {
            $sql .= ' AND t.rowid not in (select distinct fk_product_parent from '.$this->db->prefix().'product_attribute_combination)';
            $sql .= ' AND t.rowid not in (select distinct fk_product_child from '.$this->db->prefix().'product_attribute_combination)';
        }
        if ($variant_filter == 2) {
            $sql .= ' AND t.rowid in (select distinct fk_product_parent from '.$this->db->prefix().'product_attribute_combination)';
        }
        if ($variant_filter == 3) {
            $sql .= ' AND t.rowid in (select distinct fk_product_child from '.$this->db->prefix().'product_attribute_combination)';
        }

        // Select products of given category
        if ($category > 0) {
            $sql .= " AND c.fk_categorie = ".((int) $category);
            $sql .= " AND c.fk_product = t.rowid";
        }
        if ($mode == 1) {
            // Show only products
            $sql .= " AND t.fk_product_type = 0";
        } elseif ($mode == 2) {
            // Show only services
            $sql .= " AND t.fk_product_type = 1";
        }

        // Add sql filters
        if ($sqlfilters) {
            $errormessage = '';
        //    $sql .= forgeSQLFromUniversalSearchCriteria($sqlfilters, $errormessage);
        //runsoft add filter
            $sql .= "AND t.label like '%".$sqlfilters."%'";
            if ($errormessage) {
                throw new RestException(400, 'Error when validating parameter sqlfilters -> '.$errormessage);
            }
        }

        //this query will return total products with the filters given
        $sqlTotals =  str_replace('SELECT t.rowid, t.ref, t.ref_ext', 'SELECT count(t.rowid) as total', $sql);

        $sql .= $this->db->order($sortfield, $sortorder);
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;

            $sql .= $this->db->plimit($limit + 1, $offset);
        }

        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $min = min($num, ($limit <= 0 ? $num : $limit));
            $i = 0;
            while ($i < $min) {
                $obj = $this->db->fetch_object($result);
                if (!$ids_only) {
                    $product_static = new Product($this->db);
                    if ($product_static->fetch($obj->rowid)) {
                        if (!empty($includestockdata) && DolibarrApiAccess::$user->rights->stock->lire) {
                            $product_static->load_stock();

                            if (is_array($product_static->stock_warehouse)) {
                                foreach ($product_static->stock_warehouse as $keytmp => $valtmp) {
                                    if (isset($product_static->stock_warehouse[$keytmp]->detail_batch) && is_array($product_static->stock_warehouse[$keytmp]->detail_batch)) {
                                        foreach ($product_static->stock_warehouse[$keytmp]->detail_batch as $keytmp2 => $valtmp2) {
                                            unset($product_static->stock_warehouse[$keytmp]->detail_batch[$keytmp2]->db);
                                        }
                                    }
                                }
                            }
                        }

$product_static->image_link=$obj->photo_link;
                        $obj_ret[] = $this->_cleanObjectDatas($product_static);
                    }
                } else {
                    $obj_ret[] = $obj->rowid;
                }
                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }
        if (!count($obj_ret)) {
            throw new RestException(404, 'No product found');
        }

        //if $pagination_data is true the response will contain element data with all values and element pagination with pagination data(total,page,limit)
        if ($pagination_data) {
            $totalsResult = $this->db->query($sqlTotals);
            $total = $this->db->fetch_object($totalsResult)->total;

            $tmp = $obj_ret;
            $obj_ret = array();

            $obj_ret['data'] = $tmp;
            $obj_ret['pagination'] = array(
                'total' => (int) $total,
                'page' => $page, //count starts from 0
                'page_count' => ceil((int) $total/$limit),
                'limit' => $limit
            );
        }

        return $obj_ret;
    }





    public function index1($sortfield = "t.ref", $sortorder = 'ASC', $limit = 100, $page = 0, $mode = 0, $category = 0, $sqlfilters = '', $ids_only = false, $variant_filter = 0, $pagination_data = false, $includestockdata = 0)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $obj_ret = array();

        $socid = DolibarrApiAccess::$user->socid ? DolibarrApiAccess::$user->socid : '';

        $sql = "SELECT t.rowid, t.ref, t.ref_ext,cp.fk_categorie as idcateg";
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."product_extrafields AS ef ON ef.fk_object = t.rowid";    // So we will be able to filter on extrafields
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_product = t.rowid";
        if ($category > 0) {
            $sql .= ", ".$this->db->prefix()."categorie_product as c";
        }
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';

        if ($variant_filter == 1) {
            $sql .= ' AND t.rowid not in (select distinct fk_product_parent from '.$this->db->prefix().'product_attribute_combination)';
            $sql .= ' AND t.rowid not in (select distinct fk_product_child from '.$this->db->prefix().'product_attribute_combination)';
        }
        if ($variant_filter == 2) {
            $sql .= ' AND t.rowid in (select distinct fk_product_parent from '.$this->db->prefix().'product_attribute_combination)';
        }
        if ($variant_filter == 3) {
            $sql .= ' AND t.rowid in (select distinct fk_product_child from '.$this->db->prefix().'product_attribute_combination)';
        }

        // Select products of given category
        if ($category > 0) {
            $sql .= " AND c.fk_categorie = ".((int) $category);
            $sql .= " AND c.fk_product = t.rowid";
        }
        if ($mode == 1) {
            // Show only products
            $sql .= " AND t.fk_product_type = 0";
        } elseif ($mode == 2) {
            // Show only services
            $sql .= " AND t.fk_product_type = 1";
        }

        // Add sql filters
        if ($sqlfilters) {
            $errormessage = '';
            $sql .= forgeSQLFromUniversalSearchCriteria($sqlfilters, $errormessage);
            if ($errormessage) {
                throw new RestException(400, 'Error when validating parameter sqlfilters -> '.$errormessage);
            }
        }

        //this query will return total products with the filters given
        $sqlTotals =  str_replace('SELECT t.rowid, t.ref, t.ref_ext', 'SELECT count(t.rowid) as total', $sql);

        $sql .= $this->db->order($sortfield, $sortorder);
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;

            $sql .= $this->db->plimit($limit + 1, $offset);
        }

        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $min = min($num, ($limit <= 0 ? $num : $limit));
            $i = 0;
            while ($i < $min) {
                $obj = $this->db->fetch_object($result);
                if (!$ids_only) {
                    $product_static = new Product($this->db);
                    if ($product_static->fetch($obj->rowid)) {
                        if (!empty($includestockdata) && DolibarrApiAccess::$user->rights->stock->lire) {
                            $product_static->load_stock();

                            if (is_array($product_static->stock_warehouse)) {
                                foreach ($product_static->stock_warehouse as $keytmp => $valtmp) {
                                    if (isset($product_static->stock_warehouse[$keytmp]->detail_batch) && is_array($product_static->stock_warehouse[$keytmp]->detail_batch)) {
                                        foreach ($product_static->stock_warehouse[$keytmp]->detail_batch as $keytmp2 => $valtmp2) {
                                            unset($product_static->stock_warehouse[$keytmp]->detail_batch[$keytmp2]->db);
                                        }
                                    }
                                }
                            }
                        }


                        $obj_ret[] = $this->_cleanObjectDatas($product_static);
                    }
                } else {
                    $obj_ret[] = $obj->rowid;
                }
                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }
        if (!count($obj_ret)) {
            throw new RestException(404, 'No product found');
        }

        //if $pagination_data is true the response will contain element data with all values and element pagination with pagination data(total,page,limit)
        if ($pagination_data) {
            $totalsResult = $this->db->query($sqlTotals);
            $total = $this->db->fetch_object($totalsResult)->total;

            $tmp = $obj_ret;
            $obj_ret = array();

            $obj_ret['data'] = $tmp;
            $obj_ret['pagination'] = array(
                'total' => (int) $total,
                'page' => $page, //count starts from 0
                'page_count' => ceil((int) $total/$limit),
                'limit' => $limit
            );
        }

        return $obj_ret;
    }

    /**
     * Create product object
     *
     * @param  array $request_data Request data
     * @return int     ID of product
     */
    public function post($request_data = null)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }
        // Check mandatory fields
        $result = $this->_validate($request_data);

        foreach ($request_data as $field => $value) {
            $this->product->$field = $value;
        }
        if ($this->product->create(DolibarrApiAccess::$user) < 0) {
            throw new RestException(500, "Error creating product", array_merge(array($this->product->error), $this->product->errors));
        }

        return $this->product->id;
    }

    /**
     * Update product.
     * Price will be updated by this API only if option is set on "One price per product". See other APIs for other price modes.
     *
     * @param  int   $id           Id of product to update
     * @param  array $request_data Datas
     * @return int
     *
     * @throws RestException 401
     * @throws RestException 404
     */
    public function put($id, $request_data = null)
    {
        global $conf;

        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        $result = $this->product->fetch($id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if (!DolibarrApi::_checkAccessToResource('product', $this->product->id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $oldproduct = dol_clone($this->product);

        foreach ($request_data as $field => $value) {
            if ($field == 'id') {
                continue;
            }
            if ($field == 'stock_reel') {
                throw new RestException(400, 'Stock reel cannot be updated here. Use the /stockmovements endpoint instead');
            }
            $this->product->$field = $value;
        }

        $updatetype = false;
        if ($this->product->type != $oldproduct->type && ($this->product->isProduct() || $this->product->isService())) {
            $updatetype = true;
        }

        $result = $this->product->update($id, DolibarrApiAccess::$user, 1, 'update', $updatetype);

        // If price mode is 1 price per product
        if ($result > 0 && !empty($conf->global->PRODUCT_PRICE_UNIQ)) {
            // We update price only if it was changed
            $pricemodified = false;
            if ($this->product->price_base_type != $oldproduct->price_base_type) {
                $pricemodified = true;
            } else {
                if ($this->product->tva_tx != $oldproduct->tva_tx) {
                    $pricemodified = true;
                }
                if ($this->product->tva_npr != $oldproduct->tva_npr) {
                    $pricemodified = true;
                }
                if ($this->product->default_vat_code != $oldproduct->default_vat_code) {
                    $pricemodified = true;
                }

                if ($this->product->price_base_type == 'TTC') {
                    if ($this->product->price_ttc != $oldproduct->price_ttc) {
                        $pricemodified = true;
                    }
                    if ($this->product->price_min_ttc != $oldproduct->price_min_ttc) {
                        $pricemodified = true;
                    }
                } else {
                    if ($this->product->price != $oldproduct->price) {
                        $pricemodified = true;
                    }
                    if ($this->product->price_min != $oldproduct->price_min) {
                        $pricemodified = true;
                    }
                }
            }

            if ($pricemodified) {
                $newvat = $this->product->tva_tx;
                $newnpr = $this->product->tva_npr;
                $newvatsrccode = $this->product->default_vat_code;

                $newprice = $this->product->price;
                $newpricemin = $this->product->price_min;
                if ($this->product->price_base_type == 'TTC') {
                    $newprice = $this->product->price_ttc;
                    $newpricemin = $this->product->price_min_ttc;
                }

                $result = $this->product->updatePrice($newprice, $this->product->price_base_type, DolibarrApiAccess::$user, $newvat, $newpricemin, 0, $newnpr, 0, 0, array(), $newvatsrccode);
            }
        }

        if ($result <= 0) {
            throw new RestException(500, "Error updating product", array_merge(array($this->product->error), $this->product->errors));
        }

        return $this->get($id);
    }

    /**
     * Delete product
     *
     * @param  int         $id         Product ID
     * @return array
     */
    public function delete($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->supprimer) {
            throw new RestException(401);
        }
        $result = $this->product->fetch($id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if (!DolibarrApi::_checkAccessToResource('product', $this->product->id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        // The Product::delete() method uses the global variable $user.
        global $user;
        $user = DolibarrApiAccess::$user;

        $res = $this->product->delete(DolibarrApiAccess::$user);
        if ($res < 0) {
            throw new RestException(500, "Can't delete, error occurs");
        } elseif ($res == 0) {
            throw new RestException(409, "Can't delete, that product is probably used");
        }

        return array(
            'success' => array(
                'code' => 200,
                'message' => 'Object deleted'
            )
        );
    }

    /**
     * Get the list of subproducts of the product.
     *
     * @param  int $id      Id of parent product/service
     * @return array
     *
     * @throws RestException
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url GET {id}/subproducts
     */
    public function getSubproducts($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        if (!DolibarrApi::_checkAccessToResource('product', $id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $childsArbo = $this->product->getChildsArbo($id, 1);

        $keys = array('rowid', 'qty', 'fk_product_type', 'label', 'incdec', 'ref', 'fk_association', 'rang');
        $childs = array();
        foreach ($childsArbo as $values) {
            $childs[] = array_combine($keys, $values);
        }

        return $childs;
    }

    /**
     * Add subproduct.
     *
     * Link a product/service to a parent product/service
     *
     * @param  int $id            Id of parent product/service
     * @param  int $subproduct_id Id of child product/service
     * @param  int $qty           Quantity
     * @param  int $incdec        1=Increase/decrease stock of child when parent stock increase/decrease
     * @return int
     *
     * @throws RestException
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url POST {id}/subproducts/add
     */
    public function addSubproducts($id, $subproduct_id, $qty, $incdec = 1)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        if (!DolibarrApi::_checkAccessToResource('product', $id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $result = $this->product->add_sousproduit($id, $subproduct_id, $qty, $incdec);
        if ($result <= 0) {
            throw new RestException(500, "Error adding product child");
        }
        return $result;
    }

    /**
     * Remove subproduct.
     * Unlink a product/service from a parent product/service
     *
     * @param  int $id             Id of parent product/service
     * @param  int $subproduct_id  Id of child product/service
     * @return int
     *
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url DELETE {id}/subproducts/remove/{subproduct_id}
     */
    public function delSubproducts($id, $subproduct_id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        if (!DolibarrApi::_checkAccessToResource('product', $id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $result = $this->product->del_sousproduit($id, $subproduct_id);
        if ($result <= 0) {
            throw new RestException(500, "Error while removing product child");
        }
        return $result;
    }


    /**
     * Get categories for a product
     *
     * @param int    $id        ID of product
     * @param string $sortfield Sort field
     * @param string $sortorder Sort order
     * @param int    $limit     Limit for list
     * @param int    $page      Page number
     *
     * @return mixed
     *
     * @url GET {id}/categories
     */
    public function getCategories($id, $sortfield = "s.rowid", $sortorder = 'ASC', $limit = 0, $page = 0)
    {
        if (!DolibarrApiAccess::$user->rights->categorie->lire) {
            throw new RestException(401);
        }

        $categories = new Categorie($this->db);

        $result = $categories->getListForItem($id, 'product', $sortfield, $sortorder, $limit, $page);

        if (empty($result)) {
            throw new RestException(404, 'No category found');
        }

        if ($result < 0) {
            throw new RestException(503, 'Error when retrieve category list : '.join(',', array_merge(array($categories->error), $categories->errors)));
        }

        return $result;
    }

    /**
     * Get prices per segment for a product
     *
     * @param int $id ID of product
     *
     * @return mixed
     *
     * @url GET {id}/selling_multiprices/per_segment
     */
    public function getCustomerPricesPerSegment($id)
    {
        global $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        if (empty($conf->global->PRODUIT_MULTIPRICES)) {
            throw new RestException(400, 'API not available: this mode of pricing is not enabled by setup');
        }

        $result = $this->product->fetch($id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if ($result < 0) {
            throw new RestException(503, 'Error when retrieve prices list : '.join(',', array_merge(array($this->product->error), $this->product->errors)));
        }

        return array(
            'multiprices'=>$this->product->multiprices,
            'multiprices_inc_tax'=>$this->product->multiprices_ttc,
            'multiprices_min'=>$this->product->multiprices_min,
            'multiprices_min_inc_tax'=>$this->product->multiprices_min_ttc,
            'multiprices_vat'=>$this->product->multiprices_tva_tx,
            'multiprices_base_type'=>$this->product->multiprices_base_type,
            //'multiprices_default_vat_code'=>$this->product->multiprices_default_vat_code
        );
    }

    /**
     * Get prices per customer for a product
     *
     * @param int         $id                 ID of product
     * @param string       $thirdparty_id          Thirdparty id to filter orders of (example '1') {@pattern /^[0-9,]*$/i}
     *
     * @return mixed
     *
     * @url GET {id}/selling_multiprices/per_customer
     */
    public function getCustomerPricesPerCustomer($id, $thirdparty_id = '')
    {
        global $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        if (empty($conf->global->PRODUIT_CUSTOMER_PRICES)) {
            throw new RestException(400, 'API not available: this mode of pricing is not enabled by setup');
        }

        $socid = DolibarrApiAccess::$user->socid ? DolibarrApiAccess::$user->socid : '';
        if ($socid > 0 && $socid != $thirdparty_id) {
            throw new RestException(401, 'Getting prices for all customers or for the customer ID '.$thirdparty_id.' is not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $result = $this->product->fetch($id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if ($result > 0) {
            require_once DOL_DOCUMENT_ROOT.'/product/class/productcustomerprice.class.php';
            $prodcustprice = new Productcustomerprice($this->db);
            $filter = array();
            $filter['t.fk_product'] .= $id;
            if ($thirdparty_id) {
                $filter['t.fk_soc'] .= $thirdparty_id;
            }
            $result = $prodcustprice->fetchAll('', '', 0, 0, $filter);
        }

        if (empty($prodcustprice->lines)) {
            throw new RestException(404, 'Prices not found');
        }

        return $prodcustprice->lines;
    }

    /**
     * Get prices per quantity for a product
     *
     * @param int $id ID of product
     *
     * @return mixed
     *
     * @url GET {id}/selling_multiprices/per_quantity
     */
    public function getCustomerPricesPerQuantity($id)
    {
        global $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        if (empty($conf->global->PRODUIT_CUSTOMER_PRICES_BY_QTY)) {
            throw new RestException(400, 'API not available: this mode of pricing is not enabled by setup');
        }

        $result = $this->product->fetch($id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if ($result < 0) {
            throw new RestException(503, 'Error when retrieve prices list : '.join(',', array_merge(array($this->product->error), $this->product->errors)));
        }

        return array(
            'prices_by_qty'=>$this->product->prices_by_qty[0], // 1 if price by quantity was activated for the product
            'prices_by_qty_list'=>$this->product->prices_by_qty_list[0]
        );
    }

    /**
     * Add/Update purchase prices for a product.
     *
     * @param   int         $id                             ID of Product
     * @param      float        $qty                            Min quantity for which price is valid
     * @param      float        $buyprice                        Purchase price for the quantity min
     * @param      string        $price_base_type                HT or TTC
     * @param      int            $fourn_id                       Supplier ID
     * @param      int            $availability                    Product availability
     * @param    string        $ref_fourn                        Supplier ref
     * @param    float        $tva_tx                            New VAT Rate (For example 8.5. Should not be a string)
     * @param      string        $charges                        costs affering to product
     * @param      float        $remise_percent                    Discount  regarding qty (percent)
     * @param      float        $remise                            Discount  regarding qty (amount)
     * @param      int            $newnpr                            Set NPR or not
     * @param    int            $delivery_time_days                Delay in days for delivery (max). May be '' if not defined.
     * @param   string      $supplier_reputation            Reputation with this product to the defined supplier (empty, FAVORITE, DONOTORDER)
     * @param   array        $localtaxes_array                Array with localtaxes info array('0'=>type1,'1'=>rate1,'2'=>type2,'3'=>rate2) (loaded by getLocalTaxesFromRate(vatrate, 0, ...) function).
     * @param   string      $newdefaultvatcode              Default vat code
     * @param      float        $multicurrency_buyprice         Purchase price for the quantity min in currency
     * @param      string        $multicurrency_price_base_type    HT or TTC in currency
     * @param      float        $multicurrency_tx                Rate currency
     * @param      string        $multicurrency_code                Currency code
     * @param      string        $desc_fourn                     Custom description for product_fourn_price
     * @param      string        $barcode                         Barcode
     * @param      int            $fk_barcode_type                 Barcode type
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url POST {id}/purchase_prices
     */
    public function addPurchasePrice($id, $qty, $buyprice, $price_base_type, $fourn_id, $availability, $ref_fourn, $tva_tx, $charges = 0, $remise_percent = 0, $remise = 0, $newnpr = 0, $delivery_time_days = 0, $supplier_reputation = '', $localtaxes_array = array(), $newdefaultvatcode = '', $multicurrency_buyprice = 0, $multicurrency_price_base_type = 'HT', $multicurrency_tx = 1, $multicurrency_code = '', $desc_fourn = '', $barcode = '', $fk_barcode_type = null)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        $result = $this->productsupplier->fetch($id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if (!DolibarrApi::_checkAccessToResource('product', $this->productsupplier->id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $socid = DolibarrApiAccess::$user->socid ? DolibarrApiAccess::$user->socid : '';
        if ($socid > 0 && $socid != $fourn_id) {
            throw new RestException(401, 'Adding purchase price for the supplier ID '.$fourn_id.' is not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $result = $this->productsupplier->add_fournisseur(DolibarrApiAccess::$user, $fourn_id, $ref_fourn, $qty);
        if ($result < 0) {
            throw new RestException(500, "Error adding supplier to product : ".$this->db->lasterror());
        }

        $fourn = new Fournisseur($this->db);
        $result = $fourn->fetch($fourn_id);
        if ($result <= 0) {
            throw new RestException(404, 'Supplier not found');
        }

        // Clean data
        $ref_fourn = sanitizeVal($ref_fourn, 'alphanohtml');
        $desc_fourn = sanitizeVal($desc_fourn, 'restricthtml');
        $barcode = sanitizeVal($barcode, 'alphanohtml');

        $result = $this->productsupplier->update_buyprice($qty, $buyprice, DolibarrApiAccess::$user, $price_base_type, $fourn, $availability, $ref_fourn, $tva_tx, $charges, $remise_percent, $remise, $newnpr, $delivery_time_days, $supplier_reputation, $localtaxes_array, $newdefaultvatcode, $multicurrency_buyprice, $multicurrency_price_base_type, $multicurrency_tx, $multicurrency_code, $desc_fourn, $barcode, $fk_barcode_type);

        if ($result <= 0) {
            throw new RestException(500, "Error updating buy price : ".$this->db->lasterror());
        }
        return (int) $this->productsupplier->product_fourn_price_id;
    }

    /**
     * Delete purchase price for a product
     *
     * @param  int $id Product ID
     * @param  int $priceid purchase price ID
     *
     * @url DELETE {id}/purchase_prices/{priceid}
     *
     * @return int
     *
     * @throws RestException 401
     * @throws RestException 404
     *
     */
    public function deletePurchasePrice($id, $priceid)
    {
        if (!DolibarrApiAccess::$user->rights->produit->supprimer) {
            throw new RestException(401);
        }
        $result = $this->productsupplier->fetch($id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if (!DolibarrApi::_checkAccessToResource('product', $this->productsupplier->id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $resultsupplier = 0;
        if ($result > 0) {
            $resultsupplier = $this->productsupplier->remove_product_fournisseur_price($priceid);
        }

        return $resultsupplier;
    }

    /**
     * Get a list of all purchase prices of products
     *
     * @param  string $sortfield  Sort field
     * @param  string $sortorder  Sort order
     * @param  int    $limit      Limit for list
     * @param  int    $page       Page number
     * @param  int    $mode       Use this param to filter list (0 for all, 1 for only product, 2 for only service)
     * @param  int    $category   Use this param to filter list by category of product
     * @param  int    $supplier   Use this param to filter list by supplier
     * @param  string $sqlfilters Other criteria to filter answers separated by a comma. Syntax example "(t.tobuy:=:0) and (t.tosell:=:1)"
     * @return array              Array of product objects
     *
     * @url GET purchase_prices
     */
    public function getSupplierProducts($sortfield = "t.ref", $sortorder = 'ASC', $limit = 100, $page = 0, $mode = 0, $category = 0, $supplier = 0, $sqlfilters = '')
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $obj_ret = array();

        // Force id of company for external users
        $socid = DolibarrApiAccess::$user->socid ? DolibarrApiAccess::$user->socid : '';
        if ($socid > 0) {
            if ($supplier != $socid || empty($supplier)) {
                throw new RestException(401, 'As an external user, you can request only for your supplier id = '.$socid);
            }
        }

        $sql = "SELECT t.rowid, t.ref, t.ref_ext";
        $sql .= " FROM ".$this->db->prefix()."product as t";
        if ($category > 0) {
            $sql .= ", ".$this->db->prefix()."categorie_product as c";
        }
        $sql .= ", ".$this->db->prefix()."product_fournisseur_price as s";

        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';

        if ($supplier > 0) {
            $sql .= " AND s.fk_soc = ".((int) $supplier);
        }
        if ($socid > 0) {    // if external user
            $sql .= " AND s.fk_soc = ".((int) $socid);
        }
        $sql .= " AND s.fk_product = t.rowid";
        // Select products of given category
        if ($category > 0) {
            $sql .= " AND c.fk_categorie = ".((int) $category);
            $sql .= " AND c.fk_product = t.rowid";
        }
        if ($mode == 1) {
            // Show only products
            $sql .= " AND t.fk_product_type = 0";
        } elseif ($mode == 2) {
            // Show only services
            $sql .= " AND t.fk_product_type = 1";
        }
        // Add sql filters
        if ($sqlfilters) {
            $errormessage = '';
            $sql .= forgeSQLFromUniversalSearchCriteria($sqlfilters, $errormessage);
            if ($errormessage) {
                throw new RestException(400, 'Error when validating parameter sqlfilters -> '.$errormessage);
            }
        }

        $sql .= $this->db->order($sortfield, $sortorder);
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;
            $sql .= $this->db->plimit($limit + 1, $offset);
        }
        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $min = min($num, ($limit <= 0 ? $num : $limit));
            $i = 0;
            while ($i < $min) {
                $obj = $this->db->fetch_object($result);

                $product_fourn = new ProductFournisseur($this->db);
                $product_fourn_list = $product_fourn->list_product_fournisseur_price($obj->rowid, '', '', 0, 0);
                foreach ($product_fourn_list as $tmpobj) {
                    $this->_cleanObjectDatas($tmpobj);
                }

                //var_dump($product_fourn_list->db);exit;
                $obj_ret[$obj->rowid] = $product_fourn_list;

                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }
        if (!count($obj_ret)) {
            throw new RestException(404, 'No product found');
        }
        return $obj_ret;
    }

    /**
     * Get purchase prices for a product
     *
     * Return an array with product information.
     * TODO implement getting a product by ref or by $ref_ext
     *
     * @param  int    $id               ID of product
     * @param  string $ref              Ref of element
     * @param  string $ref_ext          Ref ext of element
     * @param  string $barcode          Barcode of element
     * @return array|mixed              Data without useless information
     *
     * @url GET {id}/purchase_prices
     *
     * @throws RestException 401
     * @throws RestException 403
     * @throws RestException 404
     *
     */
    public function getPurchasePrices($id, $ref = '', $ref_ext = '', $barcode = '')
    {
        if (empty($id) && empty($ref) && empty($ref_ext) && empty($barcode)) {
            throw new RestException(400, 'bad value for parameter id, ref, ref_ext or barcode');
        }

        $id = (empty($id) ? 0 : $id);

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $socid = DolibarrApiAccess::$user->socid ? DolibarrApiAccess::$user->socid : '';

        $result = $this->product->fetch($id, $ref, $ref_ext, $barcode);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if (!DolibarrApi::_checkAccessToResource('product', $this->product->id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $product_fourn_list = array();

        if ($result) {
            $product_fourn = new ProductFournisseur($this->db);
            $product_fourn_list = $product_fourn->list_product_fournisseur_price($this->product->id, '', '', 0, 0, ($socid > 0 ? $socid : 0));
        }

        foreach ($product_fourn_list as $tmpobj) {
            $this->_cleanObjectDatas($tmpobj);
        }

        return $this->_cleanObjectDatas($product_fourn_list);
    }

    /**
     * Get attributes.
     *
     * @param  string $sortfield  Sort field
     * @param  string $sortorder  Sort order
     * @param  int    $limit      Limit for list
     * @param  int    $page       Page number
     * @param  string $sqlfilters Other criteria to filter answers separated by a comma. Syntax example "(t.ref:like:color)"
     * @return array
     *
     * @throws RestException 401
     * @throws RestException 404
     * @throws RestException 503
     *
     * @url GET attributes
     */
    public function getAttributes($sortfield = "t.ref", $sortorder = 'ASC', $limit = 100, $page = 0, $sqlfilters = '')
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $sql = "SELECT t.rowid, t.ref, t.ref_ext, t.label, t.position, t.entity";
        $sql .= " FROM ".$this->db->prefix()."product_attribute as t";
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';

        // Add sql filters
        if ($sqlfilters) {
            $errormessage = '';
            $sql .= forgeSQLFromUniversalSearchCriteria($sqlfilters, $errormessage);
            if ($errormessage) {
                throw new RestException(400, 'Error when validating parameter sqlfilters -> '.$errormessage);
            }
        }

        $sql .= $this->db->order($sortfield, $sortorder);
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;

            $sql .= $this->db->plimit($limit, $offset);
        }

        $result = $this->db->query($sql);

        if (!$result) {
            throw new RestException(503, 'Error when retrieve product attribute list : '.$this->db->lasterror());
        }

        $return = array();
        while ($result = $this->db->fetch_object($query)) {
            $tmp = new ProductAttribute($this->db);
            $tmp->id = $result->rowid;
            $tmp->ref = $result->ref;
            $tmp->ref_ext = $result->ref_ext;
            $tmp->label = $result->label;
            $tmp->position = $result->position;
            $tmp->entity = $result->entity;

            $return[] = $this->_cleanObjectDatas($tmp);
        }

        if (!count($return)) {
            throw new RestException(404, 'No product attribute found');
        }

        return $return;
    }

    /**
     * Get attribute by ID.
     *
     * @param  int $id ID of Attribute
     * @return array
     *
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url GET attributes/{id}
     */
    public function getAttributeById($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $prodattr = new ProductAttribute($this->db);
        $result = $prodattr->fetch((int) $id);

        if ($result < 0) {
            throw new RestException(404, "Product attribute not found");
        }

        $fields = ["id", "ref", "ref_ext", "label", "position", "entity"];

        foreach ($prodattr as $field => $value) {
            if (!in_array($field, $fields)) {
                unset($prodattr->{$field});
            }
        }

        $sql = "SELECT COUNT(*) as nb FROM ".$this->db->prefix()."product_attribute_combination2val as pac2v";
        $sql .= " JOIN ".$this->db->prefix()."product_attribute_combination as pac ON pac2v.fk_prod_combination = pac.rowid";
        $sql .= " WHERE pac2v.fk_prod_attr = ".((int) $prodattr->id)." AND pac.entity IN (".getEntity('product').")";

        $resql = $this->db->query($sql);
        $obj = $this->db->fetch_object($resql);
        $prodattr->is_used_by_products = (int) $obj->nb;

        return $prodattr;
    }

    /**
     * Get attributes by ref.
     *
     * @param  string $ref Reference of Attribute
     * @return array
     *
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url GET attributes/ref/{ref}
     */
    public function getAttributesByRef($ref)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $ref = trim($ref);

        $sql = "SELECT rowid, ref, ref_ext, label, position, entity FROM ".$this->db->prefix()."product_attribute WHERE ref LIKE '".$this->db->escape($ref)."' AND entity IN (".getEntity('product').")";

        $query = $this->db->query($sql);

        if (!$this->db->num_rows($query)) {
            throw new RestException(404);
        }

        $result = $this->db->fetch_object($query);

        $attr = array();
        $attr['id'] = $result->rowid;
        $attr['ref'] = $result->ref;
        $attr['ref_ext'] = $result->ref_ext;
        $attr['label'] = $result->label;
        $attr['rang'] = $result->position;
        $attr['position'] = $result->position;
        $attr['entity'] = $result->entity;

        $sql = "SELECT COUNT(*) as nb FROM ".$this->db->prefix()."product_attribute_combination2val as pac2v";
        $sql .= " JOIN ".$this->db->prefix()."product_attribute_combination as pac ON pac2v.fk_prod_combination = pac.rowid";
        $sql .= " WHERE pac2v.fk_prod_attr = ".((int) $result->rowid)." AND pac.entity IN (".getEntity('product').")";

        $resql = $this->db->query($sql);
        $obj = $this->db->fetch_object($resql);

        $attr["is_used_by_products"] = (int) $obj->nb;

        return $attr;
    }

    /**
     * Get attributes by ref_ext.
     *
     * @param  string $ref_ext External reference of Attribute
     * @return array
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url GET attributes/ref_ext/{ref_ext}
     */
    public function getAttributesByRefExt($ref_ext)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $ref_ext = trim($ref_ext);

        $sql = "SELECT rowid, ref, ref_ext, label, position, entity FROM ".$this->db->prefix()."product_attribute WHERE ref_ext LIKE '".$this->db->escape($ref_ext)."' AND entity IN (".getEntity('product').")";

        $query = $this->db->query($sql);

        if (!$this->db->num_rows($query)) {
            throw new RestException(404);
        }

        $result = $this->db->fetch_object($query);

        $attr = array();
        $attr['id'] = $result->rowid;
        $attr['ref'] = $result->ref;
        $attr['ref_ext'] = $result->ref_ext;
        $attr['label'] = $result->label;
        $attr['rang'] = $result->position;
        $attr['position'] = $result->position;
        $attr['entity'] = $result->entity;

        $sql = "SELECT COUNT(*) as nb FROM ".$this->db->prefix()."product_attribute_combination2val as pac2v";
        $sql .= " JOIN ".$this->db->prefix()."product_attribute_combination as pac ON pac2v.fk_prod_combination = pac.rowid";
        $sql .= " WHERE pac2v.fk_prod_attr = ".((int) $result->rowid)." AND pac.entity IN (".getEntity('product').")";

        $resql = $this->db->query($sql);
        $obj = $this->db->fetch_object($resql);
        $attr["is_used_by_products"] = (int) $obj->nb;

        return $attr;
    }

    /**
     * Add attributes.
     *
     * @param  string $ref   Reference of Attribute
     * @param  string $label Label of Attribute
     * @param  string $ref_ext   Reference of Attribute
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url POST attributes
     */
    public function addAttributes($ref, $label, $ref_ext = '')
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        $prodattr = new ProductAttribute($this->db);
        $prodattr->label = $label;
        $prodattr->ref = $ref;
        $prodattr->ref_ext = $ref_ext;

        $resid = $prodattr->create(DolibarrApiAccess::$user);
        if ($resid <= 0) {
            throw new RestException(500, "Error creating new attribute");
        }
        return $resid;
    }

    /**
     * Update attributes by id.
     *
     * @param  int $id    ID of Attribute
     * @param  array $request_data Datas
     * @return array
     *
     * @throws RestException
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url PUT attributes/{id}
     */
    public function putAttributes($id, $request_data = null)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        $prodattr = new ProductAttribute($this->db);

        $result = $prodattr->fetch((int) $id);
        if ($result == 0) {
            throw new RestException(404, 'Attribute not found');
        } elseif ($result < 0) {
            throw new RestException(500, "Error fetching attribute");
        }

        foreach ($request_data as $field => $value) {
            if ($field == 'rowid') {
                continue;
            }
            $prodattr->$field = $value;
        }

        if ($prodattr->update(DolibarrApiAccess::$user) > 0) {
            $result = $prodattr->fetch((int) $id);
            if ($result == 0) {
                throw new RestException(404, 'Attribute not found');
            } elseif ($result < 0) {
                throw new RestException(500, "Error fetching attribute");
            } else {
                return $prodattr;
            }
        }
        throw new RestException(500, "Error updating attribute");
    }

    /**
     * Delete attributes by id.
     *
     * @param  int $id     ID of Attribute
     * @return int        Result of deletion
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url DELETE attributes/{id}
     */
    public function deleteAttributes($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->supprimer) {
            throw new RestException(401);
        }

        $prodattr = new ProductAttribute($this->db);
        $prodattr->id = (int) $id;
        $result = $prodattr->delete(DolibarrApiAccess::$user);

        if ($result <= 0) {
            throw new RestException(500, "Error deleting attribute");
        }

        return $result;
    }

    /**
     * Get attribute value by id.
     *
     * @param  int $id ID of Attribute value
     * @return array
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url GET attributes/values/{id}
     */
    public function getAttributeValueById($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $sql = "SELECT rowid, fk_product_attribute, ref, value FROM ".$this->db->prefix()."product_attribute_value WHERE rowid = ".(int) $id." AND entity IN (".getEntity('product').")";

        $query = $this->db->query($sql);

        if (!$query) {
            throw new RestException(401);
        }

        if (!$this->db->num_rows($query)) {
            throw new RestException(404, 'Attribute value not found');
        }

        $result = $this->db->fetch_object($query);

        $attrval = array();
        $attrval['id'] = $result->rowid;
        $attrval['fk_product_attribute'] = $result->fk_product_attribute;
        $attrval['ref'] = $result->ref;
        $attrval['value'] = $result->value;

        return $attrval;
    }

    /**
     * Get attribute value by ref.
     *
     * @param  int $id ID of Attribute value
     * @param  string $ref Ref of Attribute value
     * @return array
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url GET attributes/{id}/values/ref/{ref}
     */
    public function getAttributeValueByRef($id, $ref)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $ref = trim($ref);

        $sql = "SELECT rowid, fk_product_attribute, ref, value FROM ".$this->db->prefix()."product_attribute_value";
        $sql .= " WHERE ref LIKE '".$this->db->escape($ref)."' AND fk_product_attribute = ".((int) $id)." AND entity IN (".getEntity('product').")";

        $query = $this->db->query($sql);

        if (!$query) {
            throw new RestException(401);
        }

        if (!$this->db->num_rows($query)) {
            throw new RestException(404, 'Attribute value not found');
        }

        $result = $this->db->fetch_object($query);

        $attrval = array();
        $attrval['id'] = $result->rowid;
        $attrval['fk_product_attribute'] = $result->fk_product_attribute;
        $attrval['ref'] = $result->ref;
        $attrval['value'] = $result->value;

        return $attrval;
    }

    /**
     * Delete attribute value by ref.
     *
     * @param  int $id ID of Attribute
     * @param  string $ref Ref of Attribute value
     * @return int
     *
     * @throws RestException 401
     *
     * @url DELETE attributes/{id}/values/ref/{ref}
     */
    public function deleteAttributeValueByRef($id, $ref)
    {
        if (!DolibarrApiAccess::$user->rights->produit->supprimer) {
            throw new RestException(401);
        }

        $ref = trim($ref);

        $sql = "SELECT rowid FROM ".$this->db->prefix()."product_attribute_value";
        $sql .= " WHERE ref LIKE '".$this->db->escape($ref)."' AND fk_product_attribute = ".((int) $id)." AND entity IN (".getEntity('product').")";
        $query = $this->db->query($sql);

        if (!$query) {
            throw new RestException(401);
        }

        if (!$this->db->num_rows($query)) {
            throw new RestException(404, 'Attribute value not found');
        }

        $result = $this->db->fetch_object($query);

        $attrval = new ProductAttributeValue($this->db);
        $attrval->id = $result->rowid;
        $result = $attrval->delete(DolibarrApiAccess::$user);
        if ($result > 0) {
            return 1;
        }

        throw new RestException(500, "Error deleting attribute value");
    }

    /**
     * Get all values for an attribute id.
     *
     * @param  int $id ID of an Attribute
     * @return array
     *
     * @throws RestException 401
     * @throws RestException 500    System error
     *
     * @url GET attributes/{id}/values
     */
    public function getAttributeValues($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $objectval = new ProductAttributeValue($this->db);

        $return = $objectval->fetchAllByProductAttribute((int) $id);

        if (count($return) == 0) {
            throw new RestException(404, 'Attribute values not found');
        }

        foreach ($return as $key => $val) {
            $return[$key] = $this->_cleanObjectDatas($return[$key]);
        }

        return $return;
    }

    /**
     * Get all values for an attribute ref.
     *
     * @param  string $ref Ref of an Attribute
     * @return array
     *
     * @throws RestException 401
     *
     * @url GET attributes/ref/{ref}/values
     */
    public function getAttributeValuesByRef($ref)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $ref = trim($ref);

        $return = array();

        $sql = "SELECT ";
        $sql .= "v.fk_product_attribute, v.rowid, v.ref, v.value FROM ".$this->db->prefix()."product_attribute_value as v";
        $sql .= " WHERE v.fk_product_attribute IN (SELECT rowid FROM ".$this->db->prefix()."product_attribute WHERE ref LIKE '".$this->db->escape($ref)."')";

        $resql = $this->db->query($sql);

        while ($result = $this->db->fetch_object($resql)) {
            $tmp = new ProductAttributeValue($this->db);
            $tmp->fk_product_attribute = $result->fk_product_attribute;
            $tmp->id = $result->rowid;
            $tmp->ref = $result->ref;
            $tmp->value = $result->value;

            $return[] = $this->_cleanObjectDatas($tmp);
        }

        return $return;
    }

    /**
     * Add attribute value.
     *
     * @param  int    $id    ID of Attribute
     * @param  string $ref   Reference of Attribute value
     * @param  string $value Value of Attribute value
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url POST attributes/{id}/values
     */
    public function addAttributeValue($id, $ref, $value)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        if (empty($ref) || empty($value)) {
            throw new RestException(401);
        }

        $objectval = new ProductAttributeValue($this->db);
        $objectval->fk_product_attribute = ((int) $id);
        $objectval->ref = $ref;
        $objectval->value = $value;

        if ($objectval->create(DolibarrApiAccess::$user) > 0) {
            return $objectval->id;
        }
        throw new RestException(500, "Error creating new attribute value");
    }

    /**
     * Update attribute value.
     *
     * @param  int $id ID of Attribute
     * @param  array $request_data Datas
     * @return array
     *
     * @throws RestException 401
     * @throws RestException 500    System error
     *
     * @url PUT attributes/values/{id}
     */
    public function putAttributeValue($id, $request_data)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        $objectval = new ProductAttributeValue($this->db);
        $result = $objectval->fetch((int) $id);

        if ($result == 0) {
            throw new RestException(404, 'Attribute value not found');
        } elseif ($result < 0) {
            throw new RestException(500, "Error fetching attribute value");
        }

        foreach ($request_data as $field => $value) {
            if ($field == 'rowid') {
                continue;
            }
            $objectval->$field = $value;
        }

        if ($objectval->update(DolibarrApiAccess::$user) > 0) {
            $result = $objectval->fetch((int) $id);
            if ($result == 0) {
                throw new RestException(404, 'Attribute not found');
            } elseif ($result < 0) {
                throw new RestException(500, "Error fetching attribute");
            } else {
                return $objectval;
            }
        }
        throw new RestException(500, "Error updating attribute");
    }

    /**
     * Delete attribute value by id.
     *
     * @param  int $id ID of Attribute value
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url DELETE attributes/values/{id}
     */
    public function deleteAttributeValueById($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->supprimer) {
            throw new RestException(401);
        }

        $objectval = new ProductAttributeValue($this->db);
        $objectval->id = (int) $id;

        if ($objectval->delete(DolibarrApiAccess::$user) > 0) {
            return 1;
        }
        throw new RestException(500, "Error deleting attribute value");
    }

    /**
     * Get product variants.
     *
     * @param  int     $id             ID of Product
     * @param  int  $includestock   Default value 0. If parameter is set to 1 the response will contain stock data of each variant
     * @return array
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url GET {id}/variants
     */
    public function getVariants($id, $includestock = 0)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $prodcomb = new ProductCombination($this->db);
        $combinations = $prodcomb->fetchAllByFkProductParent((int) $id);

        foreach ($combinations as $key => $combination) {
            $prodc2vp = new ProductCombination2ValuePair($this->db);
            $combinations[$key]->attributes = $prodc2vp->fetchByFkCombination((int) $combination->id);
            $combinations[$key] = $this->_cleanObjectDatas($combinations[$key]);

            if (!empty($includestock) && DolibarrApiAccess::$user->rights->stock->lire) {
                $productModel = new Product($this->db);
                $productModel->fetch((int) $combination->fk_product_child);
                $productModel->load_stock($includestock);
                $combinations[$key]->stock_warehouse = $this->_cleanObjectDatas($productModel)->stock_warehouse;
            }
        }

        return $combinations;
    }

    /**
     * Get product variants by Product ref.
     *
     * @param  string $ref Ref of Product
     * @return array
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url GET ref/{ref}/variants
     */
    public function getVariantsByProdRef($ref)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(401);
        }

        $result = $this->product->fetch('', $ref);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        $prodcomb = new ProductCombination($this->db);
        $combinations = $prodcomb->fetchAllByFkProductParent((int) $this->product->id);

        foreach ($combinations as $key => $combination) {
            $prodc2vp = new ProductCombination2ValuePair($this->db);
            $combinations[$key]->attributes = $prodc2vp->fetchByFkCombination((int) $combination->id);
            $combinations[$key] = $this->_cleanObjectDatas($combinations[$key]);
        }

        return $combinations;
    }

    /**
     * Add variant.
     *
     * "features" is a list of attributes pairs id_attribute=>id_value. Example: array(id_color=>id_Blue, id_size=>id_small, id_option=>id_val_a, ...)
     *
     * @param  int $id ID of Product
     * @param  float $weight_impact Weight impact of variant
     * @param  float $price_impact Price impact of variant
     * @param  bool $price_impact_is_percent Price impact in percent (true or false)
     * @param  array $features List of attributes pairs id_attribute->id_value. Example: array(id_color=>id_Blue, id_size=>id_small, id_option=>id_val_a, ...)
     * @param  string $reference Customized reference of variant
     * @param  string $ref_ext External reference of variant
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url POST {id}/variants
     */
    public function addVariant($id, $weight_impact, $price_impact, $price_impact_is_percent, $features, $reference = '', $ref_ext = '')
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        if (empty($id) || empty($features) || !is_array($features)) {
            throw new RestException(401);
        }

        $weight_impact = price2num($weight_impact);
        $price_impact = price2num($price_impact);

        $prodattr = new ProductAttribute($this->db);
        $prodattr_val = new ProductAttributeValue($this->db);
        foreach ($features as $id_attr => $id_value) {
            if ($prodattr->fetch((int) $id_attr) < 0) {
                throw new RestException(401);
            }
            if ($prodattr_val->fetch((int) $id_value) < 0) {
                throw new RestException(401);
            }
        }

        $result = $this->product->fetch((int) $id);
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        $prodcomb = new ProductCombination($this->db);

        $result = $prodcomb->createProductCombination(DolibarrApiAccess::$user, $this->product, $features, array(), $price_impact_is_percent, $price_impact, $weight_impact, $reference, $ref_ext);
        if ($result > 0) {
            return $result;
        } else {
            throw new RestException(500, "Error creating new product variant");
        }
    }

    /**
     * Add variant by product ref.
     *
     * "features" is a list of attributes pairs id_attribute=>id_value. Example: array(id_color=>id_Blue, id_size=>id_small, id_option=>id_val_a, ...)
     *
     * @param  string $ref                      Ref of Product
     * @param  float  $weight_impact            Weight impact of variant
     * @param  float  $price_impact             Price impact of variant
     * @param  bool   $price_impact_is_percent  Price impact in percent (true or false)
     * @param  array  $features                 List of attributes pairs id_attribute->id_value. Example: array(id_color=>id_Blue, id_size=>id_small, id_option=>id_val_a, ...)
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url POST ref/{ref}/variants
     */
    public function addVariantByProductRef($ref, $weight_impact, $price_impact, $price_impact_is_percent, $features)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        if (empty($ref) || empty($features) || !is_array($features)) {
            throw new RestException(401);
        }

        $weight_impact = price2num($weight_impact);
        $price_impact = price2num($price_impact);

        $prodattr = new ProductAttribute($this->db);
        $prodattr_val = new ProductAttributeValue($this->db);
        foreach ($features as $id_attr => $id_value) {
            if ($prodattr->fetch((int) $id_attr) < 0) {
                throw new RestException(404);
            }
            if ($prodattr_val->fetch((int) $id_value) < 0) {
                throw new RestException(404);
            }
        }

        $result = $this->product->fetch('', trim($ref));
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        $prodcomb = new ProductCombination($this->db);
        if (!$prodcomb->fetchByProductCombination2ValuePairs($this->product->id, $features)) {
            $result = $prodcomb->createProductCombination(DolibarrApiAccess::$user, $this->product, $features, array(), $price_impact_is_percent, $price_impact, $weight_impact);
            if ($result > 0) {
                return $result;
            } else {
                throw new RestException(500, "Error creating new product variant");
            }
        } else {
            return $prodcomb->id;
        }
    }

    /**
     * Put product variants.
     *
     * @param  int $id ID of Variant
     * @param  array $request_data Datas
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url PUT variants/{id}
     */
    public function putVariant($id, $request_data = null)
    {
        if (!DolibarrApiAccess::$user->rights->produit->creer) {
            throw new RestException(401);
        }

        $prodcomb = new ProductCombination($this->db);
        $prodcomb->fetch((int) $id);

        foreach ($request_data as $field => $value) {
            if ($field == 'rowid') {
                continue;
            }
            $prodcomb->$field = $value;
        }

        $result = $prodcomb->update(DolibarrApiAccess::$user);
        if ($result > 0) {
            return 1;
        }
        throw new RestException(500, "Error editing variant");
    }

    /**
     * Delete product variants.
     *
     * @param  int $id     ID of Variant
     * @return int        Result of deletion
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     *
     * @url DELETE variants/{id}
     */
    public function deleteVariant($id)
    {
        if (!DolibarrApiAccess::$user->rights->produit->supprimer) {
            throw new RestException(401);
        }

        $prodcomb = new ProductCombination($this->db);
        $prodcomb->id = (int) $id;
        $result = $prodcomb->delete(DolibarrApiAccess::$user);
        if ($result <= 0) {
            throw new RestException(500, "Error deleting variant");
        }
        return $result;
    }

    /**
     * Get stock data for the product id given.
     * Optionaly with $selected_warehouse_id parameter user can get stock of specific warehouse
     *
     * @param  int $id ID of Product
     * @param  int $selected_warehouse_id ID of warehouse
     * @return int
     *
     * @throws RestException 500    System error
     * @throws RestException 401
     * @throws RestException 404
     *
     * @url GET {id}/stock
     */
    public function getStock($id, $selected_warehouse_id = null)
    {

        if (!DolibarrApiAccess::$user->rights->produit->lire || !DolibarrApiAccess::$user->rights->stock->lire) {
            throw new RestException(401);
        }

        if (!DolibarrApi::_checkAccessToResource('product', $id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        $product_model = new Product($this->db);
        $product_model->fetch($id);
        $product_model->load_stock();

        $stockData = $this->_cleanObjectDatas($product_model)->stock_warehouse;
        if ($selected_warehouse_id) {
            foreach ($stockData as $warehouse_id => $warehouse) {
                if ($warehouse_id != $selected_warehouse_id) {
                    unset($stockData[$warehouse_id]);
                }
            }
        }

        if (empty($stockData)) {
            throw new RestException(404, 'No stock found');
        }

        return ['stock_warehouses'=>$stockData];
    }

    // phpcs:disable PEAR.NamingConventions.ValidFunctionName.PublicUnderscore
    /**
     * Clean sensible object datas
     *
     * @param   Object  $object     Object to clean
     * @return  Object              Object with cleaned properties
     */
    protected function _cleanObjectDatas($object)
    {
        // phpcs:enable
        $object = parent::_cleanObjectDatas($object);

        unset($object->statut);

        unset($object->regeximgext);
        unset($object->price_by_qty);
        unset($object->prices_by_qty_id);
        unset($object->libelle);
        unset($object->product_id_already_linked);
        unset($object->reputations);
        unset($object->db);
        unset($object->name);
        unset($object->firstname);
        unset($object->lastname);
        unset($object->civility_id);
        unset($object->contact);
        unset($object->contact_id);
        unset($object->thirdparty);
        unset($object->user);
        unset($object->origin);
        unset($object->origin_id);
        unset($object->fourn_pu);
        unset($object->fourn_price_base_type);
        unset($object->fourn_socid);
        unset($object->ref_fourn);
        unset($object->ref_supplier);
        unset($object->product_fourn_id);
        unset($object->fk_project);

        unset($object->mode_reglement_id);
        unset($object->cond_reglement_id);
        unset($object->demand_reason_id);
        unset($object->transport_mode_id);
        unset($object->cond_reglement);
        unset($object->shipping_method_id);
        unset($object->model_pdf);
        unset($object->note);

        unset($object->nbphoto);
        unset($object->recuperableonly);
        unset($object->multiprices_recuperableonly);
        unset($object->tva_npr);
        unset($object->lines);
        unset($object->fk_bank);
        unset($object->fk_account);

        unset($object->supplierprices);    // Mut use another API to get them

        if (empty(DolibarrApiAccess::$user->rights->stock->lire)) {
            unset($object->stock_reel);
            unset($object->stock_theorique);
            unset($object->stock_warehouse);
        }

        return $object;
    }

    /**
     * Validate fields before create or update object
     *
     * @param  array $data Datas to validate
     * @return array
     * @throws RestException
     */
    private function _validate($data)
    {
        $product = array();
        foreach (Products::$FIELDS as $field) {
            if (!isset($data[$field])) {
                throw new RestException(400, "$field field missing");
            }
            $product[$field] = $data[$field];
        }
        return $product;
    }

    /**
     * Get properties of 1 product object.
     * Return an array with product information.
     *
     * @param  int    $id                         ID of product
     * @param  string $ref                        Ref of element
     * @param  string $ref_ext                    Ref ext of element
     * @param  string $barcode                    Barcode of element
     * @param  int    $includestockdata           Load also information about stock (slower)
     * @param  bool   $includesubproducts         Load information about subproducts (if product is a virtual product)
     * @param  bool   $includeparentid            Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includeifobjectisused    Check if product object is used and set property 'is_object_used' with result.
     * @param  bool   $includetrans                Load also the translations of product label and description
     * @return array|mixed                        Data without useless information
     *
     * @throws RestException 401
     * @throws RestException 403
     * @throws RestException 404
     */
    private function _fetch($id, $ref = '', $ref_ext = '', $barcode = '', $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includeifobjectisused = false, $includetrans = false)
    {
        if (empty($id) && empty($ref) && empty($ref_ext) && empty($barcode)) {
            throw new RestException(400, 'bad value for parameter id, ref, ref_ext or barcode');
        }

        $id = (empty($id) ? 0 : $id);

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $result = $this->product->fetch($id, $ref, $ref_ext, $barcode, 0, 0, ($includetrans ? 0 : 1));
        if (!$result) {
            throw new RestException(404, 'Product not found');
        }

        if (!DolibarrApi::_checkAccessToResource('product', $this->product->id)) {
            throw new RestException(401, 'Access not allowed for login '.DolibarrApiAccess::$user->login);
        }

        if (!empty($includestockdata) && DolibarrApiAccess::$user->rights->stock->lire) {
            $this->product->load_stock($includestockdata);

            if (is_array($this->product->stock_warehouse)) {
                foreach ($this->product->stock_warehouse as $keytmp => $valtmp) {
                    if (isset($this->product->stock_warehouse[$keytmp]->detail_batch) && is_array($this->product->stock_warehouse[$keytmp]->detail_batch)) {
                        foreach ($this->product->stock_warehouse[$keytmp]->detail_batch as $keytmp2 => $valtmp2) {
                            unset($this->product->stock_warehouse[$keytmp]->detail_batch[$keytmp2]->db);
                        }
                    }
                }
            }
        }

        if ($includesubproducts) {
            $childsArbo = $this->product->getChildsArbo($id, 1);

            $keys = array('rowid', 'qty', 'fk_product_type', 'label', 'incdec', 'ref', 'fk_association', 'rang');
            $childs = array();
            foreach ($childsArbo as $values) {
                $childs[] = array_combine($keys, $values);
            }

            $this->product->sousprods = $childs;
        }

        if ($includeparentid) {
            $prodcomb = new ProductCombination($this->db);
            $this->product->fk_product_parent = null;
            if (($fk_product_parent = $prodcomb->fetchByFkProductChild($this->product->id)) > 0) {
                $this->product->fk_product_parent = $fk_product_parent;
            }
        }

        if ($includeifobjectisused) {
            $this->product->is_object_used = ($this->product->isObjectUsed() > 0);
        }

        return $this->_cleanObjectDatas($this->product);
    }
    
/**
     * Get dynamic base URL for product images
     *
     * @return string Base URL for images
     */
    private function getImageBaseUrl()
    {
        global $dolibarr_main_url_root, $conf;
        
        // Priority order for base URL:
        // 1. Custom configuration in conf
        // 2. Dolibarr main URL root
        // 3. Current server protocol and host
        // 4. Default fallback
        
        if (!empty($conf->global->PRODUCT_IMAGE_BASE_URL)) {
            return rtrim($conf->global->PRODUCT_IMAGE_BASE_URL, '/');
        }
        
        if (!empty($dolibarr_main_url_root)) {
            return rtrim($dolibarr_main_url_root, '/');
        }
        
        // Auto-detect current domain
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        if (!empty($_SERVER['HTTP_HOST'])) {
            $domain = $_SERVER['HTTP_HOST'];
            // Remove port if it's standard (80 for HTTP, 443 for HTTPS)
            if (($_SERVER['SERVER_PORT'] == 80 && $protocol == 'http://') ||
                ($_SERVER['SERVER_PORT'] == 443 && $protocol == 'https://')) {
                $domain = preg_replace('/:\d+$/', '', $domain);
            }
            return $protocol . $domain;
        }
        
        // Fallback to default
        return 'https://ipos.ma/fide';
    }

    /**
     * Enhanced product search with multi-category filtering and search capabilities
     *
     * @param  string $sortfield              Sort field
     * @param  string $sortorder              Sort order
     * @param  int    $limit                  Limit for list
     * @param  int    $page                   Page number
     * @param  int    $mode                   Use this param to filter list (0 for all, 1 for only product, 2 for only service)
     * @param  string $categories           Comma-separated list of category IDs to filter by (e.g., "1,2,3")
     * @param  string $search_query         Search query to filter by product name/label
     * @param  string $brand_filter         Filter by brand (extrafield or custom field)
     * @param  string $game_filter             Filter by game category
     * @param  string $taste_filter         Filter by taste/flavor (goût)
     * @param  string $sqlfilters             Other criteria to filter answers separated by a comma
     * @param  bool   $ids_only               Return only IDs of product instead of all properties
     * @param  int    $variant_filter       Use this param to filter list (0 = all, 1=products without variants, 2=parent of variants, 3=variants only)
     * @param  bool   $pagination_data       If this parameter is set to true the response will include pagination data
     * @param  int    $includestockdata        Load also information about stock (slower)
     * @return array                        Array of product objects
     */
    public function getProductsWithFilters($sortfield = "t.ref", $sortorder = 'ASC', $limit = 100, $page = 0, $mode = 0, $categories = '', $search_query = '', $brand_filter = '', $game_filter = '', $taste_filter = '', $sqlfilters = '', $ids_only = false, $variant_filter = 0, $pagination_data = false, $includestockdata = 0)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $obj_ret = array();
        $socid = DolibarrApiAccess::$user->socid ? DolibarrApiAccess::$user->socid : '';

        // Base SQL query
        $sql = "SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label, t.description";
        
        // Get dynamic base URL for images
        $base_url = $this->getImageBaseUrl();
        
        // Add photo link subquery with dynamic URL
        $sql .= ",(SELECT CONCAT('".$base_url."/documents/',ecm.filepath,'/',ecm.filename) FROM 
".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr WHERE pr.barcode = t.barcode
 AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1) as photo_link ";
        
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."product_extrafields AS ef ON ef.fk_object = t.rowid";
        
        // Handle multi-category filtering
        $category_joins = '';
        $category_conditions = '';
        if (!empty($categories)) {
            $category_array = explode(',', $categories);
            $category_array = array_map('intval', array_filter($category_array, 'is_numeric'));
            
            if (!empty($category_array)) {
                $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_product = t.rowid";
                $category_conditions = " AND cp.fk_categorie IN (".implode(',', $category_array).")";
            }
        }
        
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';

        // Apply variant filters
        if ($variant_filter == 1) {
            $sql .= ' AND t.rowid not in (select distinct fk_product_parent from '.$this->db->prefix().'product_attribute_combination)';
            $sql .= ' AND t.rowid not in (select distinct fk_product_child from '.$this->db->prefix().'product_attribute_combination)';
        }
        if ($variant_filter == 2) {
            $sql .= ' AND t.rowid in (select distinct fk_product_parent from '.$this->db->prefix().'product_attribute_combination)';
        }
        if ($variant_filter == 3) {
            $sql .= ' AND t.rowid in (select distinct fk_product_child from '.$this->db->prefix().'product_attribute_combination)';
        }

        // Apply category conditions
        $sql .= $category_conditions;

        // Apply product type filter (mode)
        if ($mode == 1) {
            $sql .= " AND t.fk_product_type = 0"; // Products only
        } elseif ($mode == 2) {
            $sql .= " AND t.fk_product_type = 1"; // Services only
        }

        // Apply search query filter (search by name/label/description)
        if (!empty($search_query)) {
            $search_query = $this->db->escape($search_query);
            $sql .= " AND (t.label LIKE '%".$search_query."%' OR t.ref LIKE '%".$search_query."%' OR t.description LIKE '%".$search_query."%')";
        }

        // Apply brand filter (assuming brand is stored in extrafields or a custom field)
        if (!empty($brand_filter)) {
            $brand_filter = $this->db->escape($brand_filter);
            // Adjust this based on your actual brand field name in extrafields
            $sql .= " AND (ef.brand LIKE '%".$brand_filter."%' OR t.ref LIKE '%".$brand_filter."%')";
        }

        // Apply game filter (assuming game category is stored in extrafields or custom field)
        if (!empty($game_filter)) {
            $game_filter = $this->db->escape($game_filter);
            // Adjust this based on your actual game field name in extrafields
            $sql .= " AND (ef.game_category LIKE '%".$game_filter."%' OR ef.game LIKE '%".$game_filter."%')";
        }

        // Apply taste/flavor filter (goût)
        if (!empty($taste_filter)) {
            $taste_filter = $this->db->escape($taste_filter);
            // Adjust this based on your actual taste field name in extrafields
            $sql .= " AND (ef.taste LIKE '%".$taste_filter."%' OR ef.flavor LIKE '%".$taste_filter."%' OR ef.gout LIKE '%".$taste_filter."%')";
        }

        // Apply additional SQL filters
        if (!empty($sqlfilters)) {
            $errormessage = '';
            // Enhanced filter processing for backward compatibility
            if (strpos($sqlfilters, '(') === false && strpos($sqlfilters, ')') === false) {
                // Simple search filter (legacy support)
                $sql .= " AND t.label LIKE '%".$this->db->escape($sqlfilters)."%'";
            } else {
                // Complex SQL filters
                $sql .= forgeSQLFromUniversalSearchCriteria($sqlfilters, $errormessage);
                if ($errormessage) {
                    throw new RestException(400, 'Error when validating parameter sqlfilters -> '.$errormessage);
                }
            }
        }

        // Count query for pagination
        $sqlTotals = str_replace('SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label, t.description', 'SELECT count(DISTINCT t.rowid) as total', $sql);
        $sqlTotals = preg_replace('/,\(SELECT CONCAT.*?\) as photo_link/', '', $sqlTotals);

        // Add ordering
        $sql .= $this->db->order($sortfield, $sortorder);
        
        // Add pagination
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;
            $sql .= $this->db->plimit($limit + 1, $offset);
        }

        // Execute query
        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $min = min($num, ($limit <= 0 ? $num : $limit));
            $i = 0;
            while ($i < $min) {
                $obj = $this->db->fetch_object($result);
                if (!$ids_only) {
                    $product_static = new Product($this->db);
                    if ($product_static->fetch($obj->rowid)) {
                        // Load stock data if requested
                        if (!empty($includestockdata) && DolibarrApiAccess::$user->rights->stock->lire) {
                            $product_static->load_stock();

                            if (is_array($product_static->stock_warehouse)) {
                                foreach ($product_static->stock_warehouse as $keytmp => $valtmp) {
                                    if (isset($product_static->stock_warehouse[$keytmp]->detail_batch) && is_array($product_static->stock_warehouse[$keytmp]->detail_batch)) {
                                        foreach ($product_static->stock_warehouse[$keytmp]->detail_batch as $keytmp2 => $valtmp2) {
                                            unset($product_static->stock_warehouse[$keytmp]->detail_batch[$keytmp2]->db);
                                        }
                                    }
                                }
                            }
                        }

                        // Add photo link
                        $product_static->image_link = $obj->photo_link;
                        $obj_ret[] = $this->_cleanObjectDatas($product_static);
                    }
                } else {
                    $obj_ret[] = $obj->rowid;
                }
                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }
        
        if (!count($obj_ret)) {
            throw new RestException(404, 'No product found');
        }

        // Add pagination data if requested
        if ($pagination_data) {
            $totalsResult = $this->db->query($sqlTotals);
            $total = $this->db->fetch_object($totalsResult)->total;

            $tmp = $obj_ret;
            $obj_ret = array();

            $obj_ret['data'] = $tmp;
            $obj_ret['pagination'] = array(
                'total' => (int) $total,
                'page' => $page,
                'page_count' => ceil((int) $total/$limit),
                'limit' => $limit
            );
        }

        return $obj_ret;
    }

    /**
     * Search products with simplified parameters (API endpoint version)
     *
     * @param  string $search_name             Search by product name/label
     * @param  string $categories           Comma-separated list of category IDs
     * @param  string $brand                 Filter by brand
     * @param  string $game                 Filter by game category
     * @param  string $taste                 Filter by taste/flavor (goût)
     * @param  int    $limit                  Limit for list (default 50)
     * @param  int    $page                   Page number (default 0)
     * @param  string $sortfield              Sort field (default "t.label")
     * @param  string $sortorder              Sort order (default "ASC")
     * @return array                        Array of product objects with pagination
     *
     * @url GET search_filtered
     */
    public function searchFilteredProducts($search_name = '', $categories = '', $brand = '', $game = '', $taste = '', $limit = 50, $page = 0, $sortfield = "t.label", $sortorder = 'ASC')
    {
        return $this->getProductsWithFilters(
            $sortfield,
            $sortorder,
            $limit,
            $page,
            0, // mode (0 = all products)
            $categories,
            $search_name,
            $brand,
            $game,
            $taste,
            '', // sqlfilters
            false, // ids_only
            0, // variant_filter
            true, // pagination_data
            0 // includestockdata
        );
    }

    /**
     * Get products by multiple categories with AND logic
     * Product must belong to ALL specified categories
     *
     * @param  string $categories           Comma-separated list of category IDs (e.g., "1,2,3")
     * @param  string $search_query         Search query to filter by product title/label
     * @param  string $sortfield              Sort field
     * @param  string $sortorder              Sort order
     * @param  int    $limit                  Limit for list
     * @param  int    $page                   Page number
     * @param  bool   $pagination_data       Include pagination data in response
     * @return array                        Array of product objects
     *
     * @url GET categories/intersection
     */
    public function getProductsByCategoriesIntersection($categories = '', $search_query = '', $sortfield = "t.label", $sortorder = 'ASC', $limit = 100, $page = 0, $pagination_data = true)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        if (empty($categories)) {
            throw new RestException(400, 'Categories parameter is required');
        }

        $category_array = explode(',', $categories);
        $category_array = array_map('intval', array_filter($category_array, 'is_numeric'));
        
        if (empty($category_array)) {
            throw new RestException(400, 'Invalid categories provided');
        }

        $obj_ret = array();

        $sql = "SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label";
        
        // Get dynamic base URL for images
        $base_url = $this->getImageBaseUrl();
        
        $sql .= ",(SELECT CONCAT('".$base_url."/documents/',ecm.filepath,'/',ecm.filename) FROM 
".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr WHERE pr.barcode = t.barcode
 AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1) as photo_link ";
        
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " WHERE t.entity IN ('.getEntity('product').')";
        
        // Add condition to ensure product belongs to ALL specified categories
        foreach ($category_array as $cat_id) {
            $sql .= " AND t.rowid IN (SELECT fk_product FROM ".MAIN_DB_PREFIX."categorie_product WHERE fk_categorie = ".$cat_id.")";
        }

        // Apply search query filter
        if (!empty($search_query)) {
            $search_query = $this->db->escape($search_query);
            $sql .= " AND (t.label LIKE '%".$search_query."%' OR t.ref LIKE '%".$search_query."%' OR t.description LIKE '%".$search_query."%')";
        }

        // Count query for pagination
        $sqlTotals = str_replace('SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label', 'SELECT count(DISTINCT t.rowid) as total', $sql);
        $sqlTotals = preg_replace('/,\(SELECT CONCAT.*?\) as photo_link/', '', $sqlTotals);

        $sql .= $this->db->order($sortfield, $sortorder);
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;
            $sql .= $this->db->plimit($limit + 1, $offset);
        }

        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $min = min($num, ($limit <= 0 ? $num : $limit));
            $i = 0;
            while ($i < $min) {
                $obj = $this->db->fetch_object($result);
                $product_static = new Product($this->db);
                if ($product_static->fetch($obj->rowid)) {
                    $product_static->image_link = $obj->photo_link;
                    $obj_ret[] = $this->_cleanObjectDatas($product_static);
                }
                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }

        if (!count($obj_ret)) {
            throw new RestException(404, 'No product found');
        }

        // Add pagination data if requested
        if ($pagination_data) {
            $totalsResult = $this->db->query($sqlTotals);
            $total = $this->db->fetch_object($totalsResult)->total;

            $tmp = $obj_ret;
            $obj_ret = array();

            $obj_ret['data'] = $tmp;
            $obj_ret['pagination'] = array(
                'total' => (int) $total,
                'page' => $page,
                'page_count' => ceil((int) $total/$limit),
                'limit' => $limit
            );
        }

        return $obj_ret;
    }


    /**
     * Get product by ID with enhanced data structure
     *
     * @param  int    $id                   ID of product
     * @param  int    $includestockdata     Load also information about stock (slower)
     * @param  bool   $includesubproducts   Load information about subproducts
     * @param  bool   $includeparentid      Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includetrans         Load also the translations of product label and description
     * @return array                        Product object with enhanced data
     *
     * @url GET enhanced/{id}
     */
    public function getEnhancedProduct($id, $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includetrans = false)
    {
        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        if (empty($id)) {
            throw new RestException(400, 'Product ID is required');
        }

        // Get dynamic base URL for images
        $base_url = $this->getImageBaseUrl();

        // Get product using existing _fetch method
        $product = $this->_fetch($id, '', '', '', $includestockdata, $includesubproducts, $includeparentid, false, $includetrans);

        // Add enhanced image link if not already present
        if (empty($product->image_link) && !empty($product->barcode)) {
            $sql = "SELECT CONCAT('".$base_url."/documents/',ecm.filepath,'/',ecm.filename) as photo_link 
                    FROM ".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr 
                    WHERE pr.barcode = '".$this->db->escape($product->barcode)."'
                    AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1";
            
            $result = $this->db->query($sql);
            if ($result) {
                $obj = $this->db->fetch_object($result);
                if ($obj && $obj->photo_link) {
                    $product->image_link = $obj->photo_link;
                }
            }
        }

        // Add creation and modification dates in readable format
        if (!empty($product->date_creation)) {
            $product->date_creation_formatted = date('Y-m-d H:i:s', $product->date_creation);
        }
        if (!empty($product->date_modification)) {
            $product->date_modification_formatted = date('Y-m-d H:i:s', $product->date_modification);
        }

        return $product;
    }

    /**
     * Get multiple products by array of IDs with enhanced data structure
     *
     * @param  string $ids                  Comma-separated list of product IDs (e.g., "1,2,3,4")
     * @param  int    $includestockdata     Load also information about stock (slower)
     * @param  bool   $includesubproducts   Load information about subproducts
     * @param  bool   $includeparentid      Load also ID of parent product (if product is a variant of a parent product)
     * @param  bool   $includetrans         Load also the translations of product label and description
     * @param  bool   $pagination_data      Include pagination data in response
     * @return array                        Array of product objects with enhanced data
     *
     * @url GET enhanced/multiple
     */
    public function getMultipleEnhancedProducts($ids = '', $includestockdata = 0, $includesubproducts = false, $includeparentid = false, $includetrans = false, $pagination_data = true)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        if (empty($ids)) {
            throw new RestException(400, 'Product IDs parameter is required');
        }

        // Parse and validate IDs
        $id_array = explode(',', $ids);
        $id_array = array_map('intval', array_filter($id_array, 'is_numeric'));
        
        if (empty($id_array)) {
            throw new RestException(400, 'Invalid product IDs provided');
        }

        // Limit to prevent abuse (max 100 products at once)
        if (count($id_array) > 100) {
            throw new RestException(400, 'Maximum 100 products allowed per request');
        }

        $obj_ret = array();

        // Get dynamic base URL for images
        $base_url = $this->getImageBaseUrl();

        // Base SQL query - FIXED: removed date fields from SELECT and used proper SQL syntax
        $sql = "SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label, t.description";
        
        // Add photo link subquery with dynamic URL
        $sql .= ",(SELECT CONCAT('".$base_url."/documents/',ecm.filepath,'/',ecm.filename) FROM 
".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr WHERE pr.barcode = t.barcode
 AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1) as photo_link ";
        
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " WHERE t.entity IN (".getEntity('product').")"; // FIXED: removed quotes around getEntity
        $sql .= " AND t.rowid IN (".implode(',', $id_array).")";
        $sql .= " ORDER BY FIELD(t.rowid, ".implode(',', $id_array).")"; // Maintain order as requested

        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $i = 0;
            while ($i < $num) {
                $obj = $this->db->fetch_object($result);
                $product_static = new Product($this->db);
                if ($product_static->fetch($obj->rowid)) {
                    // Load stock data if requested
                    if (!empty($includestockdata) && DolibarrApiAccess::$user->rights->stock->lire) {
                        $product_static->load_stock();

                        if (is_array($product_static->stock_warehouse)) {
                            foreach ($product_static->stock_warehouse as $keytmp => $valtmp) {
                                if (isset($product_static->stock_warehouse[$keytmp]->detail_batch) && is_array($product_static->stock_warehouse[$keytmp]->detail_batch)) {
                                    foreach ($product_static->stock_warehouse[$keytmp]->detail_batch as $keytmp2 => $valtmp2) {
                                        unset($product_static->stock_warehouse[$keytmp]->detail_batch[$keytmp2]->db);
                                    }
                                }
                            }
                        }
                    }

                    // Load subproducts if requested
                    if ($includesubproducts) {
                        $childsArbo = $product_static->getChildsArbo($obj->rowid, 1);
                        $keys = array('rowid', 'qty', 'fk_product_type', 'label', 'incdec', 'ref', 'fk_association', 'rang');
                        $childs = array();
                        foreach ($childsArbo as $values) {
                            $childs[] = array_combine($keys, $values);
                        }
                        $product_static->sousprods = $childs;
                    }

                    // Load parent ID if requested
                    if ($includeparentid) {
                        $prodcomb = new ProductCombination($this->db);
                        $product_static->fk_product_parent = null;
                        if (($fk_product_parent = $prodcomb->fetchByFkProductChild($product_static->id)) > 0) {
                            $product_static->fk_product_parent = $fk_product_parent;
                        }
                    }

                    // Add photo link
                    $product_static->image_link = $obj->photo_link;

                    // Add formatted dates
                    if (!empty($product_static->date_creation)) {
                        $product_static->date_creation_formatted = date('Y-m-d H:i:s', $product_static->date_creation);
                    }
                    if (!empty($product_static->date_modification)) {
                        $product_static->date_modification_formatted = date('Y-m-d H:i:s', $product_static->date_modification);
                    }

                    $obj_ret[] = $this->_cleanObjectDatas($product_static);
                }
                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }

        if (!count($obj_ret)) {
            throw new RestException(404, 'No products found for the provided IDs');
        }

        // Add pagination data if requested
        if ($pagination_data) {
            $tmp = $obj_ret;
            $obj_ret = array();

            $obj_ret['data'] = $tmp;
            $obj_ret['pagination'] = array(
                'total' => count($tmp),
                'requested_ids' => $id_array,
                'found_products' => count($tmp),
                'missing_ids' => array_diff($id_array, array_column($tmp, 'id'))
            );
        }

        return $obj_ret;
    }

    /**
     * Get products by date range with enhanced filtering
     *
     * @param  string $date_field           Date field to filter by ('creation' or 'modification')
     * @param  string $date_from            Start date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format)
     * @param  string $date_to              End date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format)
     * @param  string $search_name          Search by product name/label
     * @param  string $categories           Comma-separated list of category IDs
     * @param  string $brand                Filter by brand
     * @param  int    $limit                Limit for list (default 50)
     * @param  int    $page                 Page number (default 0)
     * @param  string $sortfield            Sort field (default "t.datec")
     * @param  string $sortorder            Sort order (default "DESC")
     * @param  bool   $pagination_data      Include pagination data in response
     * @return array                        Array of product objects with pagination
     *
     * @url GET by_date
     */
    public function getProductsByDate($date_field = 'creation', $date_from = '', $date_to = '', $search_name = '', $categories = '', $brand = '', $limit = 50, $page = 0, $sortfield = '', $sortorder = 'DESC', $pagination_data = true)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        // Validate date field
        if (!in_array($date_field, ['creation', 'modification'])) {
            throw new RestException(400, 'Invalid date_field. Use "creation" or "modification"');
        }

        $obj_ret = array();

        // Set default sort field based on date_field - FIXED: use actual database column names
        if (empty($sortfield)) {
            $sortfield = ($date_field == 'creation') ? 't.datec' : 't.tms';
        }

        // Get dynamic base URL for images
        $base_url = $this->getImageBaseUrl();

        // Base SQL query - FIXED: removed problematic date fields from SELECT
        $sql = "SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label, t.description";
        
        // Add photo link subquery with dynamic URL
        $sql .= ",(SELECT CONCAT('".$base_url."/documents/',ecm.filepath,'/',ecm.filename) FROM 
".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr WHERE pr.barcode = t.barcode
 AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1) as photo_link ";
        
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."product_extrafields AS ef ON ef.fk_object = t.rowid";
        
        // Handle multi-category filtering
        if (!empty($categories)) {
            $category_array = explode(',', $categories);
            $category_array = array_map('intval', array_filter($category_array, 'is_numeric'));
            
            if (!empty($category_array)) {
                $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_product = t.rowid";
            }
        }
        
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';

        // Apply date filters - FIXED: use proper database column names
        $date_column = ($date_field == 'creation') ? 't.datec' : 't.tms';
        
        if (!empty($date_from)) {
            $date_from_ts = strtotime($date_from);
            if ($date_from_ts === false) {
                throw new RestException(400, 'Invalid date_from format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS');
            }
            $sql .= " AND ".$date_column." >= '".$this->db->idate($date_from_ts)."'";
        }
        
        if (!empty($date_to)) {
            $date_to_ts = strtotime($date_to . ' 23:59:59'); // Include end of day
            if ($date_to_ts === false) {
                throw new RestException(400, 'Invalid date_to format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS');
            }
            $sql .= " AND ".$date_column." <= '".$this->db->idate($date_to_ts)."'";
        }

        // Apply category conditions
        if (!empty($categories)) {
            $category_array = explode(',', $categories);
            $category_array = array_map('intval', array_filter($category_array, 'is_numeric'));
            if (!empty($category_array)) {
                $sql .= " AND cp.fk_categorie IN (".implode(',', $category_array).")";
            }
        }

        // Apply search query filter
        if (!empty($search_name)) {
            $search_name = $this->db->escape($search_name);
            $sql .= " AND (t.label LIKE '%".$search_name."%' OR t.ref LIKE '%".$search_name."%' OR t.description LIKE '%".$search_name."%' OR t.barcode LIKE '%".$search_name."%')";
        }

        // Apply brand filter
        if (!empty($brand)) {
            $brand = $this->db->escape($brand);
            $sql .= " AND (ef.marque LIKE '%".$brand."%')";
        }

        // Count query for pagination - FIXED: simplified count query
        $sqlTotals = str_replace('SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label, t.description', 'SELECT count(DISTINCT t.rowid) as total', $sql);
        $sqlTotals = preg_replace('/,\(SELECT CONCAT.*?\) as photo_link/', '', $sqlTotals);

        // Add ordering
        $sql .= $this->db->order($sortfield, $sortorder);
        
        // Add pagination
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;
            $sql .= $this->db->plimit($limit + 1, $offset);
        }

        // Execute query
        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $min = min($num, ($limit <= 0 ? $num : $limit));
            $i = 0;
            while ($i < $min) {
                $obj = $this->db->fetch_object($result);
                $product_static = new Product($this->db);
                if ($product_static->fetch($obj->rowid)) {
                    // Add photo link
                    $product_static->image_link = $obj->photo_link;

                    // Add formatted dates
                    if (!empty($product_static->date_creation)) {
                        $product_static->date_creation_formatted = date('Y-m-d H:i:s', $product_static->date_creation);
                    }
                    if (!empty($product_static->date_modification)) {
                        $product_static->date_modification_formatted = date('Y-m-d H:i:s', $product_static->date_modification);
                    }

                    $obj_ret[] = $this->_cleanObjectDatas($product_static);
                }
                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }

        if (!count($obj_ret)) {
            throw new RestException(404, 'No products found for the specified date range');
        }

        // Add pagination data if requested
        if ($pagination_data) {
            $totalsResult = $this->db->query($sqlTotals);
            $total = $this->db->fetch_object($totalsResult)->total;

            $tmp = $obj_ret;
            $obj_ret = array();

            $obj_ret['data'] = $tmp;
            $obj_ret['pagination'] = array(
                'total' => (int) $total,
                'page' => $page,
                'page_count' => ceil((int) $total/$limit),
                'limit' => $limit,
                'date_field' => $date_field,
                'date_from' => $date_from,
                'date_to' => $date_to
            );
        }

        return $obj_ret;
    }


        /**
     * Get all available brands with product count
     *
     * @param  int $animal_category_id Optional animal category ID to filter brands
     * @return array Array of brands with product counts
     *
     * @url GET brands
     */
    public function getBrands($animal_category_id = null)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $brands = array();
        
        // Base SQL to get brands from extrafields or custom brand field
        $sql = "SELECT DISTINCT ef.marque as brand_name, COUNT(t.rowid) as product_count";
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."product_extrafields AS ef ON ef.fk_object = t.rowid";
        
        // Add category join if animal filter is specified
        if ($animal_category_id) {
            $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_product = t.rowid";
            $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie AS c ON c.rowid = cp.fk_categorie";
        }
        
        $sql .= " WHERE t.entity IN (".getEntity('product').")";
        $sql .= " AND ef.marque IS NOT NULL AND ef.marque != ''";
        
        // Filter by animal category if specified
        if ($animal_category_id) {
            $sql .= " AND (cp.fk_categorie = ".((int) $animal_category_id);
            $sql .= " OR c.fk_parent = ".((int) $animal_category_id).")";
        }
        
        $sql .= " GROUP BY ef.marque";
        $sql .= " ORDER BY brand_name ASC";

        $result = $this->db->query($sql);
        if ($result) {
            $i = 0;
            while ($i < $this->db->num_rows($result)) {
                $obj = $this->db->fetch_object($result);
                $brands[] = array(
                    'id' => $obj->brand_name,
                    'name' => $obj->brand_name,
                    'label' => $obj->brand_name,
                    'productCount' => (int) $obj->product_count
                );
                $i++;
            }
        }

        return $brands;
    }


    /**
     * Get categories filtered by animal (parent category)
     *
     * @param  int $animal_category_id Animal category ID (parent category)
     * @return array Array of categories
     *
     * @url GET categories/by_animal/{animal_category_id}
     */
    public function getCategoriesByAnimal($animal_category_id)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->categorie->lire) {
            throw new RestException(403);
        }

        if (empty($animal_category_id)) {
            throw new RestException(400, 'Animal category ID is required');
        }

        $categories = array();
        
        // Get direct children of the animal category
        $sql = "SELECT c.rowid, c.label, c.description, c.fk_parent";
        $sql .= " FROM ".MAIN_DB_PREFIX."categorie as c";
        $sql .= " WHERE c.entity IN (".getEntity('category').")";
        $sql .= " AND c.type = 0"; // Product categories only
        $sql .= " AND c.fk_parent = ".((int) $animal_category_id);
        $sql .= " ORDER BY c.label ASC";

        $result = $this->db->query($sql);
        if ($result) {
            while ($obj = $this->db->fetch_object($result)) {
                $categories[] = array(
                    'id' => $obj->rowid,
                    'label' => $obj->label,
                    'name' => $obj->label,
                    'description' => $obj->description,
                    'parent' => $obj->fk_parent
                );
            }
        }

        return $categories;
    }

    /**
     * Get all main animal categories (direct children of root category)
     *
     * @return array Array of animal categories
     *
     * @url GET animals
     */
    public function getAnimals()
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->categorie->lire) {
            throw new RestException(403);
        }

        $animals = array();
        
        // Get main animal categories (assuming they are children of category with ID 1)
        $sql = "SELECT c.rowid, c.label, c.description, c.fk_parent";
        $sql .= " FROM ".MAIN_DB_PREFIX."categorie as c";
        $sql .= " WHERE c.entity IN (".getEntity('category').")";
        $sql .= " AND c.type = 0"; // Product categories only
        $sql .= " AND c.fk_parent = 1"; // Assuming 1 is the root/global category
        $sql .= " AND c.rowid IN (2, 3, 184, 21, 31, 20)"; // Your specific animal category IDs
        $sql .= " ORDER BY c.label ASC";

        $result = $this->db->query($sql);
        if ($result) {
            while ($obj = $this->db->fetch_object($result)) {
                $animals[] = array(
                    'id' => $obj->rowid,
                    'label' => $obj->label,
                    'name' => $obj->label,
                    'description' => $obj->description,
                    'parent' => $obj->fk_parent
                );
            }
        }

        return $animals;
    }

    /**
     * Get complete filter data in one call
     *
     * @param  int $animal_category_id Optional animal category ID to filter data
     * @return array Complete filter data (categories, brands, animals)
     *
     * @url GET filter_data
     */
    public function getFilterData($animal_category_id = null)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $filter_data = array(
            'categories' => array(),
            'brands' => array(),
            'animals' => array(),
            'success' => true
        );

        try {
            // Get animals (always return all animals)
            $filter_data['animals'] = $this->getAnimals();

            // Get categories (filtered by animal if specified)
            if ($animal_category_id) {
                $filter_data['categories'] = $this->getCategoriesByAnimal($animal_category_id);
            } else {
                // Get all main categories (children of all animal categories)
                $animals = $filter_data['animals'];
                $all_categories = array();
                foreach ($animals as $animal) {
                    $animal_categories = $this->getCategoriesByAnimal($animal['id']);
                    $all_categories = array_merge($all_categories, $animal_categories);
                }
                $filter_data['categories'] = $all_categories;
            }

            // Get brands (filtered by animal if specified)
            $filter_data['brands'] = $this->getBrands($animal_category_id);

        } catch (Exception $e) {
            $filter_data['success'] = false;
            $filter_data['error'] = $e->getMessage();
        }

        return $filter_data;
    }

    /**
     * Get products with comprehensive filtering options
     * Enhanced version of your existing filtering methods
     *
     * @param  string $sortfield              Sort field
     * @param  string $sortorder              Sort order
     * @param  int    $limit                  Limit for list
     * @param  int    $page                   Page number
     * @param  int    $animal_category        Animal category ID
     * @param  int    $category               Product category ID
     * @param  string $brand                  Brand name filter
     * @param  string $search                 Search query for product name/label
     * @param  float  $price_min              Minimum price
     * @param  float  $price_max              Maximum price
     * @param  bool   $pagination_data        Include pagination data
     * @param  int    $includestockdata       Include stock data
     * @return array                          Array of filtered products
     *
     * @url GET filtered
     */
    public function getFilteredProducts($sortfield = "t.ref", $sortorder = 'ASC', $limit = 100, $page = 0, $animal_category = 0, $category = 0, $brand = '', $search = '', $price_min = 0, $price_max = 0, $pagination_data = true, $includestockdata = 0)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        $obj_ret = array();

        // Get dynamic base URL for images
        $base_url = $this->getImageBaseUrl();

        // Base SQL query
        $sql = "SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label, t.description, t.price";
        
        // Add photo link subquery
        $sql .= ",(SELECT CONCAT('".$base_url."/documents/',ecm.filepath,'/',ecm.filename) FROM 
".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr WHERE pr.barcode = t.barcode
 AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1) as photo_link ";
        
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."product_extrafields AS ef ON ef.fk_object = t.rowid";
        
        // Category joins
        $category_joins = '';
        if ($animal_category > 0 || $category > 0) {
            $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_product = t.rowid";
            if ($animal_category > 0) {
                $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie AS c ON c.rowid = cp.fk_categorie";
            }
        }
        
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';

        // Filter by animal category (parent category)
        if ($animal_category > 0) {
            $sql .= " AND (cp.fk_categorie = ".((int) $animal_category);
            $sql .= " OR c.fk_parent = ".((int) $animal_category).")";
        }

        // Filter by specific product category
        if ($category > 0) {
            if ($animal_category > 0) {
                $sql .= " AND cp.fk_categorie = ".((int) $category);
            } else {
                $sql .= " AND cp.fk_categorie = ".((int) $category);
            }
        }

        // Filter by brand
        if (!empty($brand)) {
            $brand = $this->db->escape($brand);
            $sql .= " AND ef.marque LIKE '%".$brand."%'";
        }

        // Filter by search query
        if (!empty($search)) {
            $search = $this->db->escape($search);
            $sql .= " AND (t.label LIKE '%".$search."%' OR t.ref LIKE '%".$search."%' OR t.description LIKE '%".$search."%')";
        }

        // Filter by price range
        if ($price_min > 0) {
            $sql .= " AND t.price >= ".((float) $price_min);
        }
        if ($price_max > 0) {
            $sql .= " AND t.price <= ".((float) $price_max);
        }

        // Count query for pagination
        $sqlTotals = str_replace('SELECT DISTINCT t.rowid, t.ref, t.ref_ext, t.label, t.description, t.price', 'SELECT count(DISTINCT t.rowid) as total', $sql);
        $sqlTotals = preg_replace('/,\(SELECT CONCAT.*?\) as photo_link/', '', $sqlTotals);

        // Add ordering
        $sql .= $this->db->order($sortfield, $sortorder);
        
        // Add pagination
        if ($limit) {
            if ($page < 0) {
                $page = 0;
            }
            $offset = $limit * $page;
            $sql .= $this->db->plimit($limit + 1, $offset);
        }

        // Execute query
        $result = $this->db->query($sql);
        if ($result) {
            $num = $this->db->num_rows($result);
            $min = min($num, ($limit <= 0 ? $num : $limit));
            $i = 0;
            while ($i < $min) {
                $obj = $this->db->fetch_object($result);
                $product_static = new Product($this->db);
                if ($product_static->fetch($obj->rowid)) {
                    // Load stock data if requested
                    if (!empty($includestockdata) && DolibarrApiAccess::$user->rights->stock->lire) {
                        $product_static->load_stock();

                        if (is_array($product_static->stock_warehouse)) {
                            foreach ($product_static->stock_warehouse as $keytmp => $valtmp) {
                                if (isset($product_static->stock_warehouse[$keytmp]->detail_batch) && is_array($product_static->stock_warehouse[$keytmp]->detail_batch)) {
                                    foreach ($product_static->stock_warehouse[$keytmp]->detail_batch as $keytmp2 => $valtmp2) {
                                        unset($product_static->stock_warehouse[$keytmp]->detail_batch[$keytmp2]->db);
                                    }
                                }
                            }
                        }
                    }

                    // Add photo link
                    $product_static->image_link = $obj->photo_link;
                    $obj_ret[] = $this->_cleanObjectDatas($product_static);
                }
                $i++;
            }
        } else {
            throw new RestException(503, 'Error when retrieve product list : '.$this->db->lasterror());
        }

        if (!count($obj_ret)) {
            throw new RestException(404, 'No products found');
        }

        // Add pagination data if requested
        if ($pagination_data) {
            $totalsResult = $this->db->query($sqlTotals);
            $total = $this->db->fetch_object($totalsResult)->total;

            $tmp = $obj_ret;
            $obj_ret = array();

            $obj_ret['data'] = $tmp;
            $obj_ret['pagination'] = array(
                'total' => (int) $total,
                'page' => $page,
                'page_count' => ceil((int) $total/$limit),
                'limit' => $limit
            );
        }

        return $obj_ret;
    }

    /**
     * Get price range statistics for products
     *
     * @param  int $animal_category Animal category ID to filter by
     * @param  int $category        Product category ID to filter by
     * @param  string $brand        Brand to filter by
     * @return array Price range statistics
     *
     * @url GET price_ranges
     */
    public function getPriceRanges($animal_category = 0, $category = 0, $brand = '')
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        // Base SQL to get price statistics
        $sql = "SELECT MIN(t.price) as min_price, MAX(t.price) as max_price, AVG(t.price) as avg_price, COUNT(t.rowid) as product_count";
        $sql .= " FROM ".$this->db->prefix()."product as t";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."product_extrafields AS ef ON ef.fk_object = t.rowid";
        
        // Add category joins if needed
        if ($animal_category > 0 || $category > 0) {
            $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_product = t.rowid";
            if ($animal_category > 0) {
                $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie AS c ON c.rowid = cp.fk_categorie";
            }
        }
        
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';
        $sql .= ' AND t.price > 0'; // Only include products with prices

        // Apply filters
        if ($animal_category > 0) {
            $sql .= " AND (cp.fk_categorie = ".((int) $animal_category);
            $sql .= " OR c.fk_parent = ".((int) $animal_category).")";
        }

        if ($category > 0) {
            $sql .= " AND cp.fk_categorie = ".((int) $category);
        }

        if (!empty($brand)) {
            $brand = $this->db->escape($brand);
            $sql .= " AND ef.marque LIKE '%".$brand."%'";
        }

        $result = $this->db->query($sql);
        $price_stats = array(
            'min_price' => 0,
            'max_price' => 0,
            'avg_price' => 0,
            'product_count' => 0
        );

        if ($result) {
            $obj = $this->db->fetch_object($result);
            $price_stats = array(
                'min_price' => (float) $obj->min_price,
                'max_price' => (float) $obj->max_price,
                'avg_price' => round((float) $obj->avg_price, 2),
                'product_count' => (int) $obj->product_count
            );
        }

        return $price_stats;
    }

    /**
     * Get category hierarchy with product counts
     *
     * @param  int $parent_id Parent category ID (default 1 for root categories)
     * @return array Category hierarchy with product counts
     *
     * @url GET categories/hierarchy
     */
    public function getCategoryHierarchy($parent_id = 1)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->categorie->lire) {
            throw new RestException(403);
        }

        $categories = array();
        
        // Get categories with product counts
        $sql = "SELECT c.rowid, c.label, c.description, c.fk_parent, COUNT(cp.fk_product) as product_count";
        $sql .= " FROM ".MAIN_DB_PREFIX."categorie as c";
        $sql .= " LEFT JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_categorie = c.rowid";
        $sql .= " WHERE c.entity IN (".getEntity('category').")";
        $sql .= " AND c.type = 0"; // Product categories only
        $sql .= " AND c.fk_parent = ".((int) $parent_id);
        $sql .= " GROUP BY c.rowid, c.label, c.description, c.fk_parent";
        $sql .= " ORDER BY c.label ASC";

        $result = $this->db->query($sql);
        if ($result) {
            while ($obj = $this->db->fetch_object($result)) {
                $category = array(
                    'id' => $obj->rowid,
                    'label' => $obj->label,
                    'name' => $obj->label,
                    'description' => $obj->description,
                    'parent' => $obj->fk_parent,
                    'product_count' => (int) $obj->product_count
                );

                // Get children recursively
                $children = $this->getCategoryHierarchy($obj->rowid);
                if (!empty($children)) {
                    $category['children'] = $children;
                }

                $categories[] = $category;
            }
        }

        return $categories;
    }

    /**
     * Search products with autocomplete suggestions
     *
     * @param  string $query Search query
     * @param  int    $limit Maximum number of suggestions (default 10)
     * @param  int    $animal_category Optional animal category filter
     * @return array Array of product suggestions
     *
     * @url GET search_suggestions
     */
    public function getSearchSuggestions($query = '', $limit = 10, $animal_category = 0)
    {
        global $db, $conf;

        if (!DolibarrApiAccess::$user->rights->produit->lire) {
            throw new RestException(403);
        }

        if (empty($query) || strlen($query) < 2) {
            return array();
        }

        $suggestions = array();
        $query = $this->db->escape($query);

        // Get dynamic base URL for images
        $base_url = $this->getImageBaseUrl();

        $sql = "SELECT DISTINCT t.rowid, t.ref, t.label, t.price";
        $sql .= ",(SELECT CONCAT('".$base_url."/documents/',ecm.filepath,'/',ecm.filename) FROM 
".MAIN_DB_PREFIX."ecm_files ecm, ".MAIN_DB_PREFIX."product pr WHERE pr.barcode = t.barcode
 AND ecm.src_object_type='product' and ecm.src_object_id=pr.rowid LIMIT 1) as photo_link ";
        
        $sql .= " FROM ".$this->db->prefix()."product as t";
        
        if ($animal_category > 0) {
            $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie_product AS cp ON cp.fk_product = t.rowid";
            $sql .= " INNER JOIN ".MAIN_DB_PREFIX."categorie AS c ON c.rowid = cp.fk_categorie";
        }
        
        $sql .= ' WHERE t.entity IN ('.getEntity('product').')';
        $sql .= " AND (t.label LIKE '%".$query."%' OR t.ref LIKE '%".$query."%')";

        if ($animal_category > 0) {
            $sql .= " AND (cp.fk_categorie = ".((int) $animal_category);
            $sql .= " OR c.fk_parent = ".((int) $animal_category).")";
        }

        $sql .= " ORDER BY t.label ASC";
        $sql .= $this->db->plimit($limit);

        $result = $this->db->query($sql);
        if ($result) {
            while ($obj = $this->db->fetch_object($result)) {
                $suggestions[] = array(
                    'id' => $obj->rowid,
                    'ref' => $obj->ref,
                    'label' => $obj->label,
                    'price' => (float) $obj->price,
                    'image_link' => $obj->photo_link
                );
            }
        }

        return $suggestions;
    }



}
